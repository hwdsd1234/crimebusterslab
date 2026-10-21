(function (LAB) {
'use strict';

const { CHEM_SAMPLES: CHEM, REAGENTS, TESTS, SOLUBILITY_TEXT, CONDUCTIVITY_TEXT } = LAB;
const { BIO_SAMPLES: BIO } = LAB;
const { MAT_SAMPLES: MAT, PRINT_PATTERNS } = LAB;
const { INKS, INK_BY_ID, SOLVENTS, inksMatch } = LAB;
const { t } = LAB;



const ALL_SAMPLES = [...CHEM, ...BIO, ...MAT];
const BY_ID = Object.fromEntries(ALL_SAMPLES.map(s => [s.id, s]));
const BY_CATEGORY = ALL_SAMPLES.reduce((acc, s) => {
  (acc[s.category] ||= []).push(s);
  return acc;
}, {});

const CATEGORY_LABELS = {
  white_powder: 'white powder',
  clear_liquid: 'clear liquid',
  metal: 'metal',
  fiber: 'fibre',
  hair: 'hair',
  glass: 'glass',
  soil: 'soil',
  plastic: 'plastic',
  tablet: 'tablet',
};

// Which tests the bench is able to run at all.
const RUNNABLE = new Set(TESTS.map(x => x.id));

function normalise(entry) {
  if (!entry) return null;
  if (Array.isArray(entry)) return { token: entry[0], text: entry[1] };
  return entry;
}

// Resolve what a given sample will show for a given test, preferring an authored
// observation and falling back to the numeric / enum properties on the record.
function resolveResult(sample, testId) {
  if (!sample) return null;
  const authored = normalise(sample.results?.[testId]);
  if (authored) return authored;

  switch (testId) {
    case 'appearance':
      return { token: sample.appearance, text: sample.appearance };
    case 'water':
    case 'ethanol':
    case 'acetone': {
      const s = sample.solubility?.[testId];
      if (!s) return { token: 'no change', text: 'No visible change' };
      return { token: s, text: SOLUBILITY_TEXT[s] || 'No visible change' };
    }
    case 'ph': {
      if (sample.ph == null) return null;
      const band = sample.ph < 4 ? 'strongly acidic' : sample.ph < 6.8 ? 'weakly acidic'
        : sample.ph <= 7.2 ? 'neutral' : sample.ph < 10 ? 'weakly basic' : 'strongly basic';
      return { token: `pH ${sample.ph}`, text: `pH ≈ ${sample.ph} (${band})`, key: 'pH ≈ {ph} ({band})', vars: { ph: sample.ph, band } };
    }
    case 'conductivity': {
      if (!sample.conductivity) return null;
      return { token: sample.conductivity, text: CONDUCTIVITY_TEXT[sample.conductivity] };
    }
    case 'magnet':
      return sample.magnetic
        ? { token: 'magnetic', text: 'Strongly attracted to the magnet' }
        : { token: 'non-magnetic', text: 'Not attracted to the magnet' };
    case 'density': {
      if (sample.density == null) return null;
      const d = sample.density;
      const action = d > 1 ? 'sinks' : 'floats';
      return { token: `ρ ${d}`, text: `Density ${d} g/cm³ — ${action} in water`, key: 'Density {d} g/cm³ — {action} in water', vars: { d, action } };
    }
    case 'micro':
      return sample.microData
        ? { token: 'microscopic', text: sample.results?.micro?.[1] || sample.appearance }
        : null;
    default:
      return null;
  }
}

// Full test -> token signature for a sample, used by the uniqueness solver.
function signature(sample) {
  const sig = {};
  for (const test of TESTS) {
    const r = resolveResult(sample, test.id);
    if (r) sig[test.id] = r.token;
  }
  return sig;
}

// Every test that tells two samples apart. Empty array means the pair is
// indistinguishable with the equipment on the shelf.
function distinguishingTests(a, b) {
  const sa = signature(a), sb = signature(b);
  return TESTS
    .filter(test => sa[test.id] != null && sb[test.id] != null && sa[test.id] !== sb[test.id])
    .map(test => test.id);
}

function candidatesFor(category) {
  return BY_CATEGORY[category] || [];
}

function labelFor(category) {
  return t(CATEGORY_LABELS[category] || category);
}

// Observation answers are multiple choice. Build the correct option plus plausible
// distractors drawn from other samples in the same category.
function observationOptions(category, testId, correctSample) {
  const pool = candidatesFor(category);
  const correct = resolveResult(correctSample, testId);
  if (!correct) return null;
  const seen = new Set([correct.token]);
  const options = [{ token: correct.token, text: correct.text, key: correct.key, vars: correct.vars, correct: true }];
  for (const s of pool) {
    if (options.length >= 4) break;
    const r = resolveResult(s, testId);
    if (!r || seen.has(r.token)) continue;
    seen.add(r.token);
    options.push({ token: r.token, text: r.text, key: r.key, vars: r.vars, correct: false });
  }
  return shuffleStable(options);
}

// Deterministic shuffle so a regenerated case keeps its question order stable.
function shuffleStable(list, seed = 1) {
  const out = list.slice();
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

Object.assign(LAB, { ALL_SAMPLES: ALL_SAMPLES, BY_ID: BY_ID, BY_CATEGORY: BY_CATEGORY, CATEGORY_LABELS: CATEGORY_LABELS, RUNNABLE: RUNNABLE, resolveResult: resolveResult, signature: signature, distinguishingTests: distinguishingTests, candidatesFor: candidatesFor, labelFor: labelFor, observationOptions: observationOptions, shuffleStable: shuffleStable, mulberry32: mulberry32 });
})(window.LAB);
