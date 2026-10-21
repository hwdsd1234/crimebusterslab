(function (LAB) {
'use strict';

const { TECHNIQUE_FAILURES, PPE, CHECK_LABELS } = LAB;
const { TESTS } = LAB;
const { t, tVars } = LAB;

const TEST_NAMES = Object.fromEntries(TESTS.map(x => [x.id, x.label]));
const STORAGE_KEY = 'cb-lab-v1';
const listeners = new Set();

// bottles: reagent id -> the unknown its dropper tip was touched to. A touched tip
// contaminates the bottle, so every later drop from it is suspect.
function freshTools() {
  return {
    dropper: { contaminatedWith: null },
    spatula: { contaminatedWith: null },
    electrodes: { contaminatedWith: null },
    tube: { filledFraction: 0, aimedAway: true, clampedTop: true, contents: null },
    balance: { tared: false, reading: null },
    bottles: {},
  };
}

const state = {
  mode: 'sandbox',
  seed: 0,
  case: null,
  activeDrill: null,
  ppe: Object.fromEntries(PPE.map(p => [p.id, false])),

  // Tool state is what makes contamination real.
  tools: freshTools(),

  wells: {},              // wellId -> { sample, reagent, result, labelled }
  observations: {},       // unknownLabel -> testId -> { token, key, vars, valid, note }
  measurements: {},       // unknownLabel -> { density, volume, temp, ph }
  chromatograms: [],
  microscope: null,
  burnResults: {},
  retrieved: {},
  volumeMeasures: null,
  chromaPrep: { baseline: null },

  // The student's own deductions: suspect marks and a free-text notepad.
  notes: { marks: {}, text: '' },

  technique: {},          // checkId -> 'ok' | 'failed'
  log: [],
  answers: {},
  submitted: false,
  score: { earned: 0, possible: 0 },
  clock: { startedAt: null, elapsedMs: 0 },
};

function subscribe(fn) { listeners.add(fn); }
function commit() { for (const fn of listeners) fn(state); }

function resetBench() {
  state.wells = {};
  state.observations = {};
  state.measurements = {};
  state.chromatograms = [];
  state.microscope = null;
  state.burnResults = {};
  state.retrieved = {};
  state.technique = {};
  state.log = [];
  state.answers = {};
  state.submitted = false;
  state.score = { earned: 0, possible: 0 };
  state.volumeMeasures = null;
  state.chromaPrep = { baseline: null };
  state.notes = { marks: {}, text: '' };
  state.tools = freshTools();
  state.clock = { startedAt: Date.now(), elapsedMs: 0 };
  commit();
}

function note(text, kind = 'info') {
  state.log.unshift({ t: Date.now(), text, kind });
  if (state.log.length > 200) state.log.pop();
}

function markTechnique(checkId, ok) {
  const check = t(CHECK_LABELS[checkId] || checkId);
  const current = state.technique[checkId];
  // A failure stays on the record: the event scores the technique you actually used, so a
  // later correct attempt cannot buy the point back. Both cases still have to answer,
  // because a click that logs nothing reads exactly like a button that is not wired up.
  if (current === 'failed') {
    // The two cases read differently. Repeating the mistake names the mistake; correcting
    // it must not reprint the mistake sentence, which reads as if the good technique you
    // just used were the problem.
    note(ok
      ? t('Technique "{check}" is already on the record as wrong — what you just did is correct, but that point is already lost', { check })
      : t('Already on the technique log: {problem} — a wrong technique stays marked', {
          problem: t(TECHNIQUE_FAILURES[checkId] || check),
        }), 'info');
    return;
  }
  if (current === 'ok' && ok) return;
  if (ok) {
    state.technique[checkId] = 'ok';
    note(t('Technique: {check} — done correctly', { check }), 'good');
  } else {
    state.technique[checkId] = 'failed';
    note(t(TECHNIQUE_FAILURES[checkId] || checkId), 'bad');
  }
}

// The cleaning check each shared tool is graded on.
const CLEANING_CHECK = { dropper: 'rinsed_between_samples', spatula: 'cleaned_between_samples', electrodes: 'rinsed_electrodes' };

// Runs a tool against a sample and reports whether contamination corrupted it.
function useTool(toolId, sampleLabel) {
  const tool = state.tools[toolId];
  if (!tool) return { ok: true };
  if (tool.contaminatedWith && tool.contaminatedWith !== sampleLabel) {
    const prior = tool.contaminatedWith;
    note(t('Contamination: the {tool} still carried residue from {prior} into {sample}',
      { tool: t(toolId), prior, sample: sampleLabel }), 'bad');
    if (CLEANING_CHECK[toolId]) markTechnique(CLEANING_CHECK[toolId], false);
    tool.contaminatedWith = sampleLabel;
    return { ok: false, contaminatedBy: prior };
  }
  tool.contaminatedWith = sampleLabel;
  return { ok: true };
}

function cleanTool(toolId) {
  if (state.tools[toolId]) {
    state.tools[toolId].contaminatedWith = null;
    note(t('Cleaned the {tool}', { tool: t(toolId) }), 'good');
  }
}

// Observations are stored English-canonical: a recorded result keeps the language
// it was produced in only in the bench log, and re-renders in any language.
function recordObservation(label, testId, result, { valid = true, note: n } = {}) {
  const key = result.key || result.text;
  (state.observations[label] ||= {})[testId] = {
    token: result.token,
    key,
    vars: result.vars || null,
    valid,
    recordedAt: Date.now(),
    note: n,
  };
  note(t('{label} · {test}: {text}', {
    label,
    test: t(TEST_NAMES[testId] || testId),
    text: observationText({ key, vars: result.vars }),
  }), valid ? 'info' : 'bad');
}

function observationText(record) {
  if (!record) return '';
  // A raw result (straight from resolveResult) carries text, a recorded one carries key.
  const key = record.key || record.text;
  return record.vars ? tVars(key, record.vars) : t(key);
}

function recordMeasurement(label, key, value) {
  (state.measurements[label] ||= {})[key] = value;
}

function ppeComplete() {
  return PPE.filter(p => state.ppe[p.id]);
}

function ppePoints() {
  return PPE.reduce((sum, p) => sum + (state.ppe[p.id] ? p.points : 0), 0);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: state.mode, seed: state.seed,
      drillId: state.mode === 'drill' ? state.activeDrill?.id || null : null,
      ppe: state.ppe, answers: state.answers, submitted: state.submitted,
      bench: {
        wells: state.wells, observations: state.observations, measurements: state.measurements,
        chromatograms: state.chromatograms, microscope: state.microscope,
        burnResults: state.burnResults, retrieved: state.retrieved,
        technique: state.technique, tools: state.tools, log: state.log,
        volumeMeasures: state.volumeMeasures, chromaPrep: state.chromaPrep, notes: state.notes,
      },
    }));
  } catch { /* storage unavailable — the lab still runs in memory */ }
}

// The mirror of save(). Anything save() writes has to come back off the same key,
// otherwise a reload silently throws away the evidence log.
function restoreBench(bench) {
  if (!bench) return;
  state.wells = bench.wells || {};
  state.observations = bench.observations || {};
  state.measurements = bench.measurements || {};
  state.chromatograms = bench.chromatograms || [];
  state.microscope = bench.microscope || null;
  state.burnResults = bench.burnResults || {};
  state.retrieved = bench.retrieved || {};
  state.technique = bench.technique || {};
  state.tools = { ...freshTools(), ...(bench.tools || {}) };
  state.volumeMeasures = bench.volumeMeasures || null;
  state.chromaPrep = bench.chromaPrep || { baseline: null };
  state.notes = { marks: {}, text: '', ...(bench.notes || {}) };
  state.log = bench.log || [];
  commit();
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function exportCsv() {
  const rows = [[t('unknown'), t('test'), t('observation'), t('reliable')]];
  for (const [label, tests] of Object.entries(state.observations)) {
    for (const [testId, r] of Object.entries(tests)) {
      rows.push([label, t(TEST_NAMES[testId] || testId), observationText(r), r.valid ? t('yes') : t('no')]);
    }
  }
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

Object.assign(LAB, { state: state, subscribe: subscribe, commit: commit, resetBench: resetBench, note: note, markTechnique: markTechnique, useTool: useTool, cleanTool: cleanTool, recordObservation: recordObservation, observationText: observationText, recordMeasurement: recordMeasurement, ppeComplete: ppeComplete, ppePoints: ppePoints, save: save, restoreBench: restoreBench, load: load, exportCsv: exportCsv });
})(window.LAB);
