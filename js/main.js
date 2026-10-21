(function (LAB) {
'use strict';

const { state, commit, resetBench, note, save, load, restoreBench, exportCsv } = LAB;
const { generateCase, DRILLS } = LAB;
const { DEVICE_BY_ID } = LAB;
const { renderShelf } = LAB;
const { STATIONS, ui, toggleAction, runAction, setParam } = LAB;
const { renderQuestions, renderTechnique, renderCaseFile } = LAB;
const { t, tb, getLang, setLang, syncDocumentLang } = LAB;

const $ = sel => document.querySelector(sel);
const stage = $('#stage');
const shelf = $('#shelf');

const SANDBOX_UNKNOWNS = [
  { label: 'U1', sampleId: 'baking_soda', category: 'white_powder' },
  { label: 'U2', sampleId: 'cornstarch', category: 'white_powder' },
  { label: 'U3', sampleId: 'table_salt', category: 'white_powder' },
  { label: 'U4', sampleId: 'citric_acid', category: 'white_powder' },
  { label: 'U5', sampleId: 'vinegar', category: 'clear_liquid' },
  { label: 'U6', sampleId: 'salt_water', category: 'clear_liquid' },
  { label: 'U7', sampleId: 'hydrogen_peroxide', category: 'clear_liquid' },
  { label: 'U8', sampleId: 'magnesium', category: 'metal' },
  { label: 'U9', sampleId: 'cotton', category: 'fiber' },
  { label: 'U10', sampleId: 'human_hair', category: 'hair' },
];

// Text that lives in index.html rather than in a render function.
function applyStaticText() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.title = t('Crime Busters Virtual Lab');
}

function redraw() {
  applyStaticText();
  renderShelf(shelf);
  const def = STATIONS[ui.station] || STATIONS.kit;
  stage.innerHTML = def.view();
  renderCaseFile($('#casefile'));
  renderTechnique($('#technique'));
  renderQuestions($('#questions'));
  renderScoreChip();
  renderModeBar();
  renderLangBar();
}

// Until a case report is submitted the chip shows progress, not a score, so it cannot
// be watched while flipping answers.
function renderScoreChip() {
  const chip = $('#scoreChip');
  if (state.case && !state.submitted) {
    const done = state.case.questions.filter(q => {
      const a = state.answers[q.id];
      return a != null && a !== '' && !(Array.isArray(a) && !a.length);
    }).length;
    chip.textContent = t('{done}/{total} answered', { done, total: state.case.questions.length });
    return;
  }
  chip.textContent = state.score.possible ? `${state.score.earned}/${state.score.possible}` : '—';
}

function renderModeBar() {
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));
}

function renderLangBar() {
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === getLang()));
}

// A case is generated from its seed, so re-generating it after a language change
// rewrites every prompt with the same unknowns, the same question ids, and the
// same answers — the bench and the marks already on the board are untouched.
function rebuildCase() {
  if (state.mode !== 'case' || state.seed == null) return;
  state.case = generateCase(state.seed);
  state.unknowns = state.case.unknowns;
}

// Several shelf entries open the same station, so the highlight follows the entry
// that was clicked rather than the station it opens.
function openDevice(id) {
  const device = DEVICE_BY_ID[id] || DEVICE_BY_ID.kit_box;
  ui.device = device.id;
  ui.station = device.station;
  ui.open = null;
  ui.lastResult = [];
}

function startCase(seed) {
  state.seed = seed;
  state.mode = 'case';
  state.case = generateCase(seed);
  state.unknowns = state.case.unknowns;
  resetBench();
  note(t('Case loaded: {title}', { title: state.case.title }), 'good');
  openDevice('kit_box');
  ui.target = state.unknowns[0]?.label || null;
  redraw();
}

function startSandbox() {
  state.mode = 'sandbox';
  state.case = null;
  state.unknowns = SANDBOX_UNKNOWNS;
  resetBench();
  openDevice('kit_box');
  ui.target = 'U1';
  redraw();
}

function startDrill(drill) {
  state.mode = 'drill';
  state.case = null;
  state.activeDrill = drill;
  state.unknowns = drill.id === 'unknown_fiber'
    ? [
        { label: 'U1', sampleId: 'wool', category: 'fiber' },
        { label: 'U2', sampleId: 'nylon', category: 'fiber' },
        { label: 'U3', sampleId: 'rayon', category: 'fiber' },
      ]
    : drill.id === 'unknown_powder'
      ? [
          { label: 'U1', sampleId: 'washing_soda', category: 'white_powder' },
          { label: 'U2', sampleId: 'baking_soda', category: 'white_powder' },
          { label: 'U3', sampleId: 'calcium_carbonate', category: 'white_powder' },
          { label: 'U4', sampleId: 'talcum', category: 'white_powder' },
        ]
      : SANDBOX_UNKNOWNS.slice(0, 4);
  resetBench();
  openDevice(drill.devices[0]);
  ui.target = state.unknowns[0]?.label;
  note(t('Drill: {title} — {goal}', { title: t(drill.title), goal: t(drill.goal) }), 'good');
  redraw();
}

// ───────────────────────── wiring ─────────────────────────

shelf.addEventListener('click', e => {
  const btn = e.target.closest('[data-device]');
  if (!btn) return;
  if (!DEVICE_BY_ID[btn.dataset.device]) return;
  openDevice(btn.dataset.device);
  redraw();
});

// Stage clicks: a well in the drawing, an action in the tool menu, a choice chip, or
// the button that carries an action out with the chosen options.
stage.addEventListener('click', e => {
  const well = e.target.closest('[data-well]');
  if (well) { ui.well = well.dataset.well; redraw(); return; }
  const chip = e.target.closest('[data-param]');
  if (chip) { setParam(chip.dataset.param, chip.dataset.value); redraw(); return; }
  const head = e.target.closest('[data-act]');
  const run = e.target.closest('[data-run]');
  if (!head && !run) return;
  if (run) runAction(ui.device, run.dataset.run);
  else if (!toggleAction(ui.device, head.dataset.act)) { redraw(); return; }
  commit();
  save();
  redraw();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.open) { ui.open = null; redraw(); }
});

$('#casefile').addEventListener('click', e => {
  const u = e.target.closest('[data-unknown]');
  if (u) { ui.target = u.dataset.unknown; redraw(); return; }
  const m = e.target.closest('[data-mark]');
  if (m) {
    const id = m.dataset.mark;
    state.notes.marks[id] = state.notes.marks[id] === m.dataset.value ? null : m.dataset.value;
    save();
    redraw();
    return;
  }
  const d = e.target.closest('[data-drill]');
  if (!d) return;
  const drill = DRILLS.find(x => x.id === d.dataset.drill);
  if (drill) startDrill(drill);
});

// The notepad is saved as it is typed and never triggers a redraw, which would drop the caret.
$('#casefile').addEventListener('input', e => {
  if (e.target.id !== 'caseNotes') return;
  state.notes.text = e.target.value;
  save();
});

function recordAnswer(el) {
  const q = state.case?.questions.find(x => x.id === el.dataset.question);
  if (!q || state.submitted) return false;
  if (el.type === 'checkbox') {
    const set = new Set(state.answers[q.id] || []);
    el.checked ? set.add(el.value) : set.delete(el.value);
    state.answers[q.id] = [...set];
  } else if (q.kind === 'measurement') {
    state.answers[q.id] = el.value === '' ? null : parseFloat(el.value);
  } else {
    state.answers[q.id] = el.value;
  }
  save();
  return true;
}

// A typed answer is stored as it is typed. Waiting for blur means the number only
// lands when the student clicks something else, and is lost if they close the tab.
$('#questions').addEventListener('input', e => {
  const el = e.target.closest('[data-question]');
  if (!el || el.type !== 'number') return;
  // No re-render here: rebuilding the panel mid-typing would drop the caret.
  if (recordAnswer(el)) renderScoreChip();
});

$('#questions').addEventListener('click', e => {
  if (e.target.id !== 'submitReport' || state.submitted) return;
  if (!window.confirm(t('Submit the report? Your answers are locked once it is graded.'))) return;
  state.submitted = true;
  note(t('Report submitted'), 'good');
  save();
  redraw();
});

$('#questions').addEventListener('change', e => {
  const el = e.target.closest('[data-question]');
  if (!el) return;
  if (!recordAnswer(el)) return;
  renderQuestions($('#questions'));
  renderScoreChip();
});

document.querySelectorAll('[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    if (mode === 'sandbox') startSandbox();
    if (mode === 'case') startCase(Math.floor(Math.random() * 1e9));
    if (mode === 'drill') startDrill(DRILLS[0]);
  });
});

$('#langSwitch').addEventListener('click', e => {
  const btn = e.target.closest('[data-lang]');
  if (!btn || btn.dataset.lang === getLang()) return;
  setLang(btn.dataset.lang);
  rebuildCase();
  redraw();
});

$('#newCase').addEventListener('click', () => startCase(Math.floor(Math.random() * 1e9)));

$('#seedCase').addEventListener('click', () => {
  const seed = parseInt($('#seedInput').value, 10);
  if (!Number.isNaN(seed)) startCase(seed);
});

$('#exportCsv').addEventListener('click', () => {
  const blob = new Blob([exportCsv()], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `crime-busters-lab-${state.seed || 'sandbox'}.csv`;
  a.click();
});

// ───────────────────────── boot ─────────────────────────

syncDocumentLang();

const saved = load();
if (saved?.mode === 'case' && saved.seed) startCase(saved.seed);
else if (saved?.mode === 'drill') startDrill(DRILLS.find(d => d.id === saved.drillId) || DRILLS[0]);
else startSandbox();

if (saved) {
  state.ppe = { ...state.ppe, ...saved.ppe };
  state.answers = saved.answers || {};
  state.submitted = !!saved.submitted;
  restoreBench(saved.bench);
  note(t('Restored the bench from your last session'), 'info');
  redraw();
}

window.addEventListener('beforeunload', save);

})(window.LAB);
