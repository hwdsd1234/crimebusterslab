(function (LAB) {
'use strict';

// The bench. Clicking a tool on the shelf selects it; the stage then shows that
// tool's apparatus on the left and, on the right, everything you can do with it.
// An action that needs a choice (which unknown, which well, which reagent) opens
// to show those choices as chips, prefilled with whatever you picked last.

const { state, note, markTechnique, useTool, cleanTool, recordObservation, recordMeasurement, ppePoints, observationText } = LAB;
const { REAGENTS, TESTS, BY_ID, resolveResult, INKS, INK_BY_ID, SOLVENTS, labelFor } = LAB;
const { DEVICE_BY_ID, PPE } = LAB;
const svg = LAB.svg;
const { t, tb } = LAB;

const ui = {
  station: 'kit', device: 'kit_box', target: null, well: 'A1', inkId: null, solvent: 'water',
  reagent: 'iodine', magnification: 10, cylinder: 10, view: 'eye', flaskMix: null,
  open: null,        // the action whose choices are showing
  lastResult: [],    // log lines the last action produced, shown beside the menu
};

const WELLS = ['A', 'B', 'C'].flatMap(r => [1, 2, 3, 4].map(c => `${r}${c}`));
const SOLID = new Set(['white_powder', 'metal', 'glass', 'soil', 'plastic', 'tablet', 'fiber', 'hair']);
const TEST_LABEL = Object.fromEntries(TESTS.map(x => [x.id, x.label]));
const FLASK_MIX = { null: 'Nothing mixed yet', swirl: 'Swirling the flask to mix', stir: 'Stirring with a rod' };
const STOCK_ML = 30;   // water already in the cylinder before a displacement reading
const LIQUID_ML = 10;  // volume of a liquid measured out for weighing
const PAPER_G = 0.42;  // weighing paper, counted in the mass if the balance was not zeroed
const BASE_MM = 10;    // chromatogram baseline height above the paper edge
const FRONT_MM = { water: 55, ethanol: 50, acetone: 58 };

function unknowns() { return state.unknowns || []; }
function sampleFor(label) {
  const u = unknowns().find(x => x.label === label);
  return u ? BY_ID[u.sampleId] : null;
}
function categoryFor(label) {
  return unknowns().find(x => x.label === label)?.category;
}
function isSolid(label) { return SOLID.has(categoryFor(label)); }
function currentTarget() {
  const list = unknowns();
  if (!list.some(u => u.label === ui.target)) ui.target = list[0]?.label || null;
  return ui.target;
}

// PPE is graded on what you were wearing when you started, so the kit box stops
// accepting new gear once the first test is on the record.
function testsStarted() { return Object.keys(state.observations).length > 0; }

// Each unknown gets its own fixed piece size, so mass ÷ displaced volume comes out to
// the sample's density without the student being handed either number.
function pieceVolume(label, sample) {
  let h = 7;
  for (const ch of `${state.seed}:${label}:${sample.id}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 2 + (h % 41) / 10;   // 2.0 – 6.0 mL
}

// ───────────────────────── ink sources ─────────────────────────

// In a case the inks are the note and each suspect's marker. The note's label never
// names the ink it was written in; matching it is the job.
function inkSources() {
  if (state.case?.chromatography) {
    return [
      { id: 'note', label: t('Ink from the note'), inkId: state.case.chromatography.questionedInkId },
      ...state.case.suspects.map(s => ({ id: s.id, label: t('{name}’s marker', { name: s.name }), inkId: s.inkId })),
    ];
  }
  return INKS.slice(0, 4).map(i => ({ id: i.id, label: t(i.label), inkId: i.id }));
}
function inkSource(id) { return inkSources().find(x => x.id === id) || inkSources()[0]; }
function currentInk() {
  if (!inkSources().some(x => x.id === ui.inkId)) ui.inkId = inkSources()[0]?.id;
  return ui.inkId;
}
function latestChromatogram(sourceId = currentInk(), solvent = ui.solvent) {
  return [...state.chromatograms].reverse().find(c => c.sourceId === sourceId && c.solvent === solvent);
}

// ───────────────────────── action parameters ─────────────────────────

const PARAMS = {
  target: {
    label: 'Evidence', key: 'target',
    options: act => unknowns().filter(u => !act.accepts || act.accepts(u.label))
      .map(u => ({ value: u.label, label: u.label, sub: labelFor(u.category) })),
    text: v => v || '—',
  },
  well: {
    label: 'Well', key: 'well',
    options: () => WELLS.map(w => ({ value: w, label: w, sub: state.wells[w]?.sample || '' })),
    text: v => v,
  },
  reagent: {
    label: 'Reagent', key: 'reagent',
    options: () => Object.values(REAGENTS).map(r => ({ value: r.id, label: t(r.name) })),
    text: v => t(REAGENTS[v]?.name || v),
  },
  ink: {
    label: 'Ink', key: 'inkId',
    options: () => inkSources().map(s => ({ value: s.id, label: s.label })),
    text: v => inkSource(v)?.label || '—',
  },
  solvent: {
    label: 'Solvent', key: 'solvent',
    options: () => Object.values(SOLVENTS).map(s => ({ value: s.id, label: t(s.name) })),
    text: v => t(SOLVENTS[v]?.name || v),
  },
  cylinder: {
    label: 'Cylinder', key: 'cylinder',
    options: () => [10, 25, 50, 100].map(c => ({ value: String(c), label: `${c} mL` })),
    text: v => `${v} mL`,
  },
};

function paramValue(key) {
  if (key === 'target') return currentTarget();
  if (key === 'ink') return currentInk();
  return ui[PARAMS[key].key];
}

function setParam(key, value) {
  const k = PARAMS[key]?.key;
  if (!k) return;
  ui[k] = key === 'cylinder' ? parseInt(value, 10) : value;
}

// The target chip row only offers the unknowns an action makes sense for, so if the
// current pick is not among them the first one that is becomes the pick.
function settleParams(act) {
  if (!act.params?.includes('target')) return;
  const opts = PARAMS.target.options(act);
  if (opts.length && !opts.some(o => o.value === ui.target)) ui.target = opts[0].value;
}

function fillLabel(act) {
  const label = typeof act.label === 'function' ? act.label() : act.label;
  const vars = {};
  for (const p of act.params || []) vars[p] = PARAMS[p].text(paramValue(p));
  return t(label, vars);
}

// ───────────────────────── bench operations ─────────────────────────

function wellColor(result, reagentId) {
  if (!result) return REAGENTS[reagentId]?.color || '#f4f7fa';
  const tok = result.token;
  if (tok === 'starch positive') return '#2b3a67';
  if (tok === 'bleaches') return '#f7fbfd';
  if (tok === 'precipitate') return '#e8e2d6';
  if (tok === 'effervesce') return '#e4f1f8';
  if (tok === 'weak positive') return '#d9c7a8';
  return REAGENTS[reagentId]?.color || '#f4f7fa';
}

function putInWell(target, wellId) {
  const well = state.wells[wellId] ||= {};
  if (well.sample && well.sample !== target) {
    note(t('Well {well} already holds {label} — choose an empty well, or rinse this one first', { well: wellId, label: well.sample }), 'bad');
    return;
  }
  const tool = isSolid(target) ? 'spatula' : 'dropper';
  const res = useTool(tool, target);
  well.sample = target;
  well.contaminated = well.contaminated || !res.ok;
  if (well.label && well.label !== target) {
    markTechnique('label_wells', false);
    note(t('Well {well} is labelled {label} but now holds {sample}', { well: wellId, label: well.label, sample: target }), 'bad');
  }
  note(t('Put {label} into well {well} with the {tool}', { label: target, well: wellId, tool: t(tool) }), res.ok ? 'info' : 'bad');
}

function labelWell(target, wellId) {
  const well = state.wells[wellId] ||= {};
  well.label = target;
  if (well.sample && well.sample !== target) {
    markTechnique('label_wells', false);
    note(t('Well {well} is labelled {label} but holds {sample}', { well: wellId, label: target, sample: well.sample }), 'bad');
    return;
  }
  markTechnique('label_wells', true);
  note(t('Wrote {label} under well {well}', { label: target, well: wellId }), 'info');
}

function addReagent(wellId, reagentId, touched) {
  const well = state.wells[wellId];
  if (!well?.sample) { note(t('Well {well} is empty — put a sample in it before adding a reagent', { well: wellId }), 'bad'); return; }
  if (well.reagent) { note(t('Well {well} already has a reagent in it — use a fresh well for the next test', { well: wellId }), 'bad'); return; }
  const bottles = state.tools.bottles;
  const dirtyBottle = bottles[reagentId] && bottles[reagentId] !== well.sample;
  if (dirtyBottle) note(t('The {reagent} bottle was contaminated with {label} earlier — this drop carries it', { reagent: t(REAGENTS[reagentId].name), label: bottles[reagentId] }), 'bad');
  markTechnique('tip_not_touched', !touched);
  if (touched) bottles[reagentId] = well.sample;
  if (!well.label) markTechnique('label_wells', false);
  markTechnique('one_drop_each', true);

  const s = sampleFor(well.sample);
  const result = resolveResult(s, reagentId);
  well.reagent = reagentId;
  well.mixColor = wellColor(result, reagentId);
  well.bubbles = result?.token === 'effervesce' || result?.token === 'reacts';
  well.precipitate = result?.token === 'precipitate' ? '#cfc7b8' : null;
  well.result = result || { token: 'no change', text: 'No visible change' };
  if (!result) {
    note(t('{test} tells you nothing about {sample}', { test: t(TEST_LABEL[reagentId]), sample: well.sample }), 'info');
    return;
  }
  recordObservation(well.sample, reagentId, result, { valid: !well.contaminated && !dirtyBottle });
}

function scrubTube() {
  const tube = state.tools.tube;
  if (!tube.filledFraction) { note(t('The tube is already empty and clean'), 'info'); return; }
  tube.filledFraction = 0;
  tube.contents = null;
  note(t('Tube scrubbed clean'), 'good');
}

function fillTube(target, fraction) {
  const tube = state.tools.tube;
  if (tube.contents && tube.contents !== target) {
    note(t('The tube still holds {label} — scrub it before using it for {sample}', { label: tube.contents, sample: target }), 'bad');
    return;
  }
  tube.filledFraction = fraction;
  tube.contents = target;
  note(fraction > 0.33
    ? t('Filled the tube nearly to the top with {label}', { label: target })
    : t('Filled the tube one quarter with {label}', { label: target }), 'info');
}

function heatTube() {
  const tube = state.tools.tube;
  if (!tube.filledFraction) { note(t('Nothing in the tube to heat'), 'info'); return; }
  if (!state.ppe.goggles) note(t('Heating without goggles on — supervisors stop you for this'), 'bad');
  markTechnique('heat_fill_third', tube.filledFraction <= 0.33);
  markTechnique('clamp_top', tube.clampedTop);
  markTechnique('heat_aim_away', tube.aimedAway);
  const s = sampleFor(tube.contents);
  if (s) recordObservation(tube.contents, 'burn', resolveResult(s, 'burn') || { token: 'heated', text: 'Heated; no visible change' },
    { valid: tube.filledFraction <= 0.33 });
}

function burnTest(target, safe) {
  const s = sampleFor(target);
  if (!s) return;
  markTechnique('burn_tweezers', safe);
  if (!safe) return;
  if (!state.ppe.goggles) { note(t('Put goggles on before running a burn test'), 'bad'); return; }
  const bd = s.burnData || { speed: 'n/a', odor: 'n/a', residue: 'n/a' };
  const result = resolveResult(s, 'burn') || { token: 'no burn', text: 'No visible change' };
  state.burnResults[target] = { ...bd, token: result.token, flammable: result.token !== 'no burn' };
  recordObservation(target, 'burn', {
    token: result.token,
    key: '{base}. Speed: {speed}; odour: {odor}; residue: {residue}',
    vars: { base: result.text, speed: bd.speed, odor: bd.odor, residue: bd.residue },
  });
}

function measurePh(target, how) {
  const s = sampleFor(target);
  if (!s || s.ph == null) { note(t('{label} has no meaningful pH', { label: target }), 'info'); return; }
  markTechnique('no_dipping', how !== 'dip');
  recordObservation(target, 'ph', resolveResult(s, 'ph'), { valid: how !== 'dip' });
  recordMeasurement(target, 'ph', s.ph);
}

function testConductivity(target) {
  const s = sampleFor(target);
  if (!s?.conductivity) { note(t('{label} cannot be tested for conductivity', { label: target }), 'info'); return; }
  const used = useTool('electrodes', target);
  markTechnique('electrodes_apart', true);
  recordObservation(target, 'conductivity', resolveResult(s, 'conductivity'), { valid: used.ok });
}

function readCylinder(view) {
  ui.view = view;
  markTechnique('meniscus_eye_level', view === 'eye');
  const v = state.volumeMeasures;
  if (!v) { note(t('Pour some water into a cylinder first'), 'info'); return; }
  const parallax = view === 'top' ? { 10: 0.3, 25: 0.6, 50: 1.2, 100: 2.5 }[v.capacity] || 1 : 0;
  v.reading = +(v.value + parallax).toFixed(1);
  note(t('Read the {capacity} mL cylinder: {v} mL (true volume {true} mL)', { capacity: v.capacity, v: v.reading, true: v.value.toFixed(1) }),
    parallax ? 'bad' : 'good');
}

function displacement(target) {
  const s = sampleFor(target);
  if (!s?.density) { note(t('{label} cannot be measured by displacement', { label: target }), 'info'); return; }
  const vol = pieceVolume(target, s);
  const parallax = ui.view === 'top' ? 0.8 : 0;
  markTechnique('meniscus_eye_level', !parallax);
  recordMeasurement(target, 'v0', STOCK_ML);
  recordMeasurement(target, 'v1', +(STOCK_ML + vol + parallax).toFixed(1));
  note(t('{label} dropped into {v0} mL of water: level rose to {v1} mL', { label: target, v0: STOCK_ML.toFixed(1), v1: (STOCK_ML + vol + parallax).toFixed(1) }),
    parallax ? 'bad' : 'info');
}

function measureLiquid(target) {
  const s = sampleFor(target);
  if (!s?.density) { note(t('{label} has no density to measure', { label: target }), 'info'); return; }
  recordMeasurement(target, 'liquidMl', LIQUID_ML);
  markTechnique('cylinder_size_match', true);
  note(t('Measured exactly {v} mL of {label} in the 10 mL cylinder, read at eye level', { v: LIQUID_ML.toFixed(1), label: target }), 'info');
}

function weigh(target) {
  const s = sampleFor(target);
  if (!s?.density) { note(t('{label} cannot be weighed for density', { label: target }), 'info'); return; }
  const bal = state.tools.balance;
  let mass;
  if (isSolid(target)) mass = s.density * pieceVolume(target, s);
  else {
    if (!state.measurements[target]?.liquidMl) { note(t('Measure out a known volume of {label} with the graduated cylinder first', { label: target }), 'bad'); return; }
    mass = s.density * LIQUID_ML;
  }
  markTechnique('tare_balance', bal.tared);
  if (!bal.tared) mass += PAPER_G;
  mass = +mass.toFixed(2);
  bal.reading = mass;
  recordMeasurement(target, 'mass', mass);
  note(t('{label} on the balance: {m} g', { label: target, m: mass.toFixed(2) }), bal.tared ? 'info' : 'bad');
}

function develop(sourceId, solvent, method, solventAbove = false) {
  const prep = state.chromaPrep;
  if (!prep.baseline) { note(t('Draw a baseline on the paper first — there is nothing to measure from'), 'bad'); return; }
  const src = inkSource(sourceId);
  const ink = INK_BY_ID[src.inkId];
  markTechnique('solvent_below_baseline', !solventAbove);
  const usedPen = prep.baseline === 'pen';
  const frontMm = FRONT_MM[solvent];
  const dyes = ink.dyes.map(d => ({
    name: d.name, color: d.color,
    mm: solventAbove ? 0 : Math.round(d.rf[solvent] * frontMm * (usedPen ? 0.6 : 1)),
  }));
  state.chromatograms.push({
    id: `c${state.chromatograms.length + 1}`, sourceId, inkId: ink.id, solvent, frontMm, dyes,
    usedPen, flooded: solventAbove, measured: null, method,
  });
  ui.inkId = sourceId; ui.solvent = solvent;
  note(t('Developed {ink} in {solvent} ({method})', { ink: src.label, solvent: t(SOLVENTS[solvent].name), method: t(method) }),
    usedPen || solventAbove ? 'bad' : 'info');
}

function measureStrip(how) {
  const c = latestChromatogram();
  if (!c) { note(t('Develop a strip for this ink and solvent first'), 'info'); return; }
  if (c.flooded) { note(t('Nothing travelled on this strip — the spots dissolved into the solvent'), 'bad'); return; }
  const fromBaseline = how !== 'edge';
  const round = how === 'cm' ? (mm => Math.round(mm / 10) * 10) : (mm => mm);
  const offset = fromBaseline ? 0 : BASE_MM;
  markTechnique('measure_from_baseline', fromBaseline);
  markTechnique('mm_precision', how !== 'cm');
  c.measured = {
    fromBaseline,
    front: round(c.frontMm + offset),
    dyes: c.dyes.map(d => round(d.mm + offset)),
  };
  note(t('Ruler on {ink} ({solvent}): solvent front {front} mm; spots at {spots} mm', {
    ink: inkSource(c.sourceId).label, solvent: t(SOLVENTS[c.solvent].name),
    front: c.measured.front, spots: c.measured.dyes.join(', '),
  }), fromBaseline && how !== 'cm' ? 'good' : 'bad');
}

function measureMicro() {
  const m = state.microscope;
  if (!m) { note(t('Mount a sample on a slide first'), 'info'); return; }
  if (!m.cover) { note(t('Put a cover slip on first, or the sample lifts off the slide'), 'bad'); return; }
  const s = BY_ID[m.sampleId];
  if (ui.magnification !== 40) { note(t('At 10× the reticle cannot resolve it — switch to 40×'), 'info'); return; }
  const valid = !m.bubbles;
  if (s.microData) {
    recordMeasurement(m.label, 'diaUm', s.microData.diameterUm);
    recordMeasurement(m.label, 'medUm', s.microData.medullaUm);
    m.measured = true;
    note(t('Reticle on {label}: hair diameter {d} µm, medulla width {w} µm', { label: m.label, d: s.microData.diameterUm, w: s.microData.medullaUm }), valid ? 'good' : 'bad');
  }
  const r = resolveResult(s, 'micro');
  if (r) recordObservation(m.label, 'micro', r, { valid });
  else if (!s.microData) note(t('Nothing at 40× tells {label} apart', { label: m.label }), 'info');
}

// ───────────────────────── what each tool can do ─────────────────────────

const solidOnly = label => isSolid(label);
const liquidOnly = label => !isSolid(label);
const hasDensity = label => sampleFor(label)?.density != null;
const solidWithDensity = label => isSolid(label) && hasDensity(label);
const liquidWithDensity = label => !isSolid(label) && hasDensity(label);
const hasPh = label => sampleFor(label)?.ph != null;
const hasMicro = label => {
  const s = sampleFor(label);
  return !!(s?.microData || s?.results?.micro);
};

const A = (id, label, params, run, extra = {}) => ({ id, label, params, run, ...extra });

const TOOLS = {
  kit_box: PPE.map(p => A(`ppe_${p.id}`, () => state.ppe[p.id] ? 'Take off: {item}' : 'Put on: {item}', [], () => {
    if (testsStarted()) {
      note(t('PPE locked: {item} would not count — you had already run a test without it', { item: t(p.name) }), 'bad');
      return;
    }
    state.ppe[p.id] = !state.ppe[p.id];
    note(state.ppe[p.id] ? t('Put on {item}', { item: t(p.name.toLowerCase()) }) : t('Took off {item}', { item: t(p.name.toLowerCase()) }),
      state.ppe[p.id] ? 'good' : 'info');
  }, { vars: () => ({ item: t(p.name) }), tone: () => state.ppe[p.id] ? 'on' : '' })),

  spot_plate: [
    A('label', 'Label well {well} as {target}', ['target', 'well'], p => labelWell(p.target, p.well)),
    A('put', 'Put {target} into well {well}', ['target', 'well'], p => putInWell(p.target, p.well), { tone: 'primary' }),
    A('drop', 'Add one drop of {reagent} to well {well}', ['reagent', 'well'], p => addReagent(p.well, p.reagent, false), { tone: 'primary' }),
    A('flood', 'Pour {reagent} into well {well} until it overflows', ['reagent', 'well'], p => {
      markTechnique('one_drop_each', false);
      note(t('Overfilled well {well} — it ran into the next well', { well: p.well }), 'bad');
      const next = WELLS[WELLS.indexOf(p.well) + 1];
      if (next && state.wells[next]) state.wells[next].contaminated = true;
    }),
    A('rinseWell', 'Rinse out well {well}', ['well'], p => {
      delete state.wells[p.well];
      note(t('Rinsed well {well} and dried it', { well: p.well }), 'info');
    }),
  ],

  dropper: [
    A('transfer', 'Draw up {target} and add a drop to well {well}', ['target', 'well'], p => putInWell(p.target, p.well), { accepts: liquidOnly, tone: 'primary' }),
    A('drop', 'Add one drop of {reagent} to well {well}, tip held above the well', ['reagent', 'well'], p => addReagent(p.well, p.reagent, false), { tone: 'primary' }),
    A('touch', 'Add {reagent} to well {well}, touching the tip to the sample', ['reagent', 'well'], p => {
      addReagent(p.well, p.reagent, true);
      if (state.wells[p.well]?.sample) note(t('The dropper tip touched the sample — the reagent bottle is contaminated for everyone after you'), 'bad');
    }),
    A('rinse', 'Rinse the dropper with distilled water', [], () => { cleanTool('dropper'); markTechnique('rinsed_between_samples', true); }),
  ],

  spatula: [
    A('scoop', 'Scoop a little {target} into well {well}', ['target', 'well'], p => putInWell(p.target, p.well), { accepts: solidOnly, tone: 'primary' }),
    A('wipe', 'Wipe the spatula clean', [], () => { cleanTool('spatula'); markTechnique('cleaned_between_samples', true); }),
  ],

  stirring_rod: [
    A('stirWell', 'Stir well {well} gently', ['well'], p => {
      const w = state.wells[p.well];
      note(w?.sample ? t('Stirred well {well}; the result settles in a few seconds', { well: p.well }) : t('Well {well} is empty', { well: p.well }), 'info');
    }),
    A('stirFlask', 'Stir the Erlenmeyer flask with the rod', [], () => { ui.flaskMix = 'stir'; markTechnique('swirl_not_stir', false); }),
  ],

  ph: [
    A('drop', 'Put a drop of {target} on the pH paper with a clean rod', ['target'], p => measurePh(p.target, 'drop'), { accepts: hasPh, tone: 'primary' }),
    A('meter', 'Measure {target} with the pH meter', ['target'], p => measurePh(p.target, 'meter'), { accepts: hasPh }),
    A('dip', 'Dip the pH paper straight into {target}', ['target'], p => measurePh(p.target, 'dip'), { accepts: hasPh }),
  ],

  conductivity: [
    A('test', 'Lower the electrodes into {target}', ['target'], p => testConductivity(p.target), { tone: 'primary' }),
    A('touch', 'Let the two electrodes touch', [], () => markTechnique('electrodes_apart', false)),
    A('rinse', 'Rinse the electrodes and dry them', [], () => { cleanTool('electrodes'); markTechnique('rinsed_electrodes', true); }),
  ],

  graduated_cylinder: [
    A('pour', 'Measure 8 mL of water in the {cylinder} cylinder', ['cylinder'], p => {
      state.volumeMeasures = { value: 8, capacity: p.cylinder, reading: null };
      markTechnique('cylinder_size_match', p.cylinder <= 10);
      note(t('Poured water to the 8 mL line of the {capacity} mL cylinder', { capacity: p.cylinder }), p.cylinder <= 10 ? 'info' : 'bad');
    }, { tone: 'primary' }),
    A('eye', 'Crouch and read the meniscus at eye level', [], () => readCylinder('eye'), { tone: 'primary' }),
    A('top', 'Read the meniscus standing, from above', [], () => readCylinder('top')),
    A('displace', 'Drop {target} into 30.0 mL of water and read the new level', ['target'], p => displacement(p.target), { accepts: solidWithDensity }),
    A('liquid', 'Measure exactly 10.0 mL of {target} for weighing', ['target'], p => measureLiquid(p.target), { accepts: liquidWithDensity }),
  ],

  balance: [
    A('tare', 'Put weighing paper on the pan and press zero', [], () => {
      state.tools.balance.tared = true;
      state.tools.balance.reading = 0;
      note(t('Balance zeroed with the weighing paper on it'), 'good');
    }),
    A('weigh', 'Weigh {target}', ['target'], p => weigh(p.target), { accepts: hasDensity, tone: 'primary' }),
  ],

  beaker: [
    A('float', 'Drop {target} into a beaker of water', ['target'], p => {
      const s = sampleFor(p.target);
      const r = resolveResult(s, 'float');
      if (!r) { note(t('{label} cannot be float-tested', { label: p.target }), 'info'); return; }
      recordObservation(p.target, 'float', r);
    }, { accepts: solidWithDensity, tone: 'primary' }),
    A('sheet', 'Develop a chromatography sheet of {ink} in {solvent}', ['ink', 'solvent'], p => develop(p.ink, p.solvent, 'sheet')),
    A('big', 'Run a 100 mL reaction in a 250 mL beaker', [], () => { markTechnique('beaker_size_match', true); }),
    A('small', 'Run a 100 mL reaction in a 100 mL beaker', [], () => { markTechnique('beaker_size_match', false); }),
    A('cylFirst', 'Measure 50 mL in a cylinder, then pour it into the beaker', [], () => { markTechnique('no_beaker_measuring', true); }),
    A('beakerMeasure', 'Measure 50 mL using the beaker’s own markings', [], () => { markTechnique('no_beaker_measuring', false); }),
  ],

  erlenmeyer: [
    A('swirl', 'Swirl the flask to mix', [], () => { ui.flaskMix = 'swirl'; markTechnique('swirl_not_stir', true); }, { tone: () => ui.flaskMix === 'swirl' ? 'on' : '' }),
    A('stir', 'Stir the flask with a rod', [], () => { ui.flaskMix = 'stir'; markTechnique('swirl_not_stir', false); }, { tone: () => ui.flaskMix === 'stir' ? 'on' : '' }),
  ],

  test_tube: [
    A('quarter', 'Fill the tube one quarter with {target}', ['target'], p => fillTube(p.target, 0.25), { tone: 'primary' }),
    A('full', 'Fill the tube to the top with {target}', ['target'], p => fillTube(p.target, 0.95)),
    A('heat', 'Heat the tube over the flame', [], heatTube, { tone: 'primary' }),
    A('scrub', 'Empty the tube and scrub it', [], scrubTube),
  ],

  test_tube_holder: [
    A('clampTop', 'Clamp the holder near the top of the tube', [], () => { state.tools.tube.clampedTop = true; }, { tone: () => state.tools.tube.clampedTop ? 'on' : '' }),
    A('clampMiddle', 'Clamp the holder in the middle of the tube', [], () => { state.tools.tube.clampedTop = false; }, { tone: () => state.tools.tube.clampedTop ? '' : 'on' }),
    A('aimAway', 'Tilt the mouth away from everyone', [], () => { state.tools.tube.aimedAway = true; }, { tone: () => state.tools.tube.aimedAway ? 'on' : '' }),
    A('aimPeople', 'Tilt the mouth toward your partner', [], () => { state.tools.tube.aimedAway = false; }, { tone: () => state.tools.tube.aimedAway ? '' : 'on' }),
    A('heat', 'Heat the tube over the flame', [], heatTube, { tone: 'primary' }),
  ],

  test_tube_rack: [
    A('quarter', 'Fill the tube one quarter with {target}', ['target'], p => fillTube(p.target, 0.25), { tone: 'primary' }),
    A('stand', 'Stand the tube upright in the rack', [], () => note(t('The tube stands in the rack — safe to leave while it settles'), 'info')),
  ],

  test_tube_brush: [
    A('scrub', 'Empty the tube and scrub it', [], scrubTube, { tone: 'primary' }),
  ],

  slide: [
    A('mount', 'Mount {target} on a clean slide', ['target'], p => {
      const s = sampleFor(p.target);
      state.microscope = { label: p.target, sampleId: s?.id, cover: null, bubbles: false, measured: false };
      note(t('Mounted {label} on a slide', { label: p.target }), 'info');
    }, { accepts: hasMicro, tone: 'primary' }),
    A('angle', 'Lower the cover slip at a 45° angle', [], () => {
      if (!state.microscope) { note(t('Mount a sample on a slide first'), 'info'); return; }
      state.microscope.cover = 'angle'; state.microscope.bubbles = false;
      markTechnique('lower_cover_45', true);
    }, { tone: 'primary' }),
    A('flat', 'Drop the cover slip flat onto the slide', [], () => {
      if (!state.microscope) { note(t('Mount a sample on a slide first'), 'info'); return; }
      state.microscope.cover = 'flat'; state.microscope.bubbles = true;
      markTechnique('lower_cover_45', false);
    }),
  ],

  microscope: [
    A('mag10', 'Focus at 10×', [], () => { ui.magnification = 10; }, { tone: () => ui.magnification === 10 ? 'on' : '' }),
    A('mag40', 'Switch to 40× and refocus', [], () => { ui.magnification = 40; }, { tone: () => ui.magnification === 40 ? 'on' : '' }),
    A('measure', 'Measure the slide with the eyepiece reticle', [], measureMicro, { tone: 'primary' }),
  ],

  hand_lens: [
    A('look', 'Examine {target} under the hand lens', ['target'], p => {
      const s = sampleFor(p.target);
      if (s) recordObservation(p.target, 'appearance', resolveResult(s, 'appearance'));
    }, { tone: 'primary' }),
  ],

  magnet: [
    A('paper', 'Wrap the magnet in paper and pass it over {target}', ['target'], p => {
      markTechnique('magnet_through_paper', true);
      recordObservation(p.target, 'magnet', resolveResult(sampleFor(p.target), 'magnet'));
    }, { accepts: solidOnly, tone: 'primary' }),
    A('direct', 'Touch the bare magnet to {target}', ['target'], p => {
      markTechnique('magnet_through_paper', false);
      recordObservation(p.target, 'magnet', resolveResult(sampleFor(p.target), 'magnet'));
    }, { accepts: solidOnly }),
  ],

  thermometer: [
    A('immerse', 'Read {target} with the bulb fully immersed', ['target'], p => {
      markTechnique('bulb_immersed', true); markTechnique('not_a_stirrer', true);
      recordMeasurement(p.target, 'temp', 21.0);
      note(t('{label}: 21.0 °C', { label: p.target }), 'info');
    }, { accepts: liquidOnly, tone: 'primary' }),
    A('partial', 'Read {target} with the bulb half out of the liquid', ['target'], p => {
      markTechnique('bulb_immersed', false);
      recordMeasurement(p.target, 'temp', 23.5);
      note(t('{label}: 23.5 °C — the bulb was reading the air', { label: p.target }), 'bad');
    }, { accepts: liquidOnly }),
    A('stir', 'Stir {target} with the thermometer', ['target'], () => markTechnique('not_a_stirrer', false), { accepts: liquidOnly }),
  ],

  tweezers: [
    A('burn', 'Hold {target} in the flame with tweezers, inside the hood', ['target'], p => burnTest(p.target, true), { accepts: solidOnly, tone: 'primary' }),
    A('retrieve', 'Lift a fragment out of the liquid with tweezers', [], () => {
      state.retrieved.done = true;
      note(t('Fragment retrieved and set on the labelled tray'), 'good');
    }),
    A('fingers', 'Fish the fragment out with your fingers', [], () => note(t('Fingers in an unknown liquid — contaminated evidence and a safety violation'), 'bad')),
  ],

  heat_source: [
    A('burn', 'Burn {target} held in tweezers, inside the hood', ['target'], p => burnTest(p.target, true), { accepts: solidOnly, tone: 'primary' }),
    A('bare', 'Hold {target} in your fingers over the flame at the bench', ['target'], p => burnTest(p.target, false), { accepts: solidOnly }),
    A('heat', 'Heat the test tube', [], heatTube),
  ],

  petri_dish: [
    A('strip', 'Develop a strip of {ink} in {solvent}', ['ink', 'solvent'], p => develop(p.ink, p.solvent, 'strip'), { tone: 'primary' }),
    A('above', 'Develop {ink} with the {solvent} poured above the baseline', ['ink', 'solvent'], p => develop(p.ink, p.solvent, 'strip', true)),
  ],

  pencil: [
    A('pencil', 'Draw the chromatography baseline in pencil', [], () => {
      state.chromaPrep.baseline = 'pencil';
      markTechnique('pencil_not_pen', true);
      note(t('Baseline marked in pencil, 10 mm above the paper edge'), 'good');
    }, { tone: 'primary' }),
    A('pen', 'Borrow a pen and draw the baseline in ink', [], () => {
      state.chromaPrep.baseline = 'pen';
      markTechnique('pencil_not_pen', false);
    }),
    A('label', 'Label well {well} as {target}', ['target', 'well'], p => labelWell(p.target, p.well)),
  ],

  ruler: [
    A('baseline', 'Measure the latest {ink} strip in {solvent} from the baseline, to the mm', ['ink', 'solvent'], () => measureStrip('mm'), { tone: 'primary' }),
    A('edge', 'Measure the latest {ink} strip in {solvent} from the paper edge', ['ink', 'solvent'], () => measureStrip('edge')),
    A('cm', 'Eyeball the latest {ink} strip in {solvent} to the nearest cm', ['ink', 'solvent'], () => measureStrip('cm')),
  ],

  paper_towels: [
    A('dropper', 'Rinse and dry the dropper', [], () => { cleanTool('dropper'); markTechnique('rinsed_between_samples', true); }),
    A('spatula', 'Wipe the spatula clean', [], () => { cleanTool('spatula'); markTechnique('cleaned_between_samples', true); }),
    A('electrodes', 'Rinse and dry the electrodes', [], () => { cleanTool('electrodes'); markTechnique('rinsed_electrodes', true); }),
    A('bottles', 'Swap any contaminated reagent bottles for fresh ones', [], () => {
      const dirty = Object.keys(state.tools.bottles);
      state.tools.bottles = {};
      note(dirty.length ? t('Replaced {n} contaminated reagent bottle(s)', { n: dirty.length }) : t('No reagent bottles needed replacing'), 'good');
    }),
  ],
};
TOOLS.cover_slip = TOOLS.slide;

function actionsFor(deviceId) { return TOOLS[deviceId] || []; }

// Runs an action with the current picks, and keeps the log lines it produced so the
// menu can show the outcome right where it was chosen.
function runAction(deviceId, actionId) {
  const act = actionsFor(deviceId).find(a => a.id === actionId);
  if (!act) return;
  settleParams(act);
  const p = {};
  for (const k of act.params || []) p[k] = paramValue(k);
  // The log is newest-first, so whatever sits above the old top entry is new.
  const marker = state.log[0];
  if ((act.params || []).includes('target') && !p.target) note(t('Nothing on the evidence tray works with this action'), 'info');
  else act.run(p);
  const idx = marker ? state.log.indexOf(marker) : state.log.length;
  ui.lastResult = state.log.slice(0, idx === -1 ? state.log.length : idx);
  if (!ui.lastResult.length) ui.lastResult = [{ text: t('Done: {action}', { action: fillLabel(act) }), kind: 'info' }];
  if (!act.params?.length) ui.open = null;
}

function toggleAction(deviceId, actionId) {
  const act = actionsFor(deviceId).find(a => a.id === actionId);
  if (!act) return;
  if (!act.params?.length) { runAction(deviceId, actionId); return true; }
  ui.open = ui.open === actionId ? null : actionId;
  if (ui.open) settleParams(act);
  return false;
}

// ───────────────────────── rendering ─────────────────────────

function actionLabel(act) {
  if (act.vars) return t(typeof act.label === 'function' ? act.label() : act.label, act.vars());
  return fillLabel(act);
}

function chipRow(act, key) {
  const def = PARAMS[key];
  const current = String(paramValue(key));
  const opts = def.options(act);
  if (!opts.length) return `<p class="empty">${t('Nothing on the evidence tray works with this action')}</p>`;
  return `<div class="chip-row" role="group" aria-label="${t(def.label)}">
    <span class="chip-label">${t(def.label)}</span>
    ${opts.map(o => `<button class="chip ${o.value === current ? 'on' : ''}" data-param="${key}" data-value="${o.value}" aria-pressed="${o.value === current}">
      ${o.label}${o.sub ? `<small>${o.sub}</small>` : ''}</button>`).join('')}
  </div>`;
}

function toolPanel(deviceId) {
  const d = DEVICE_BY_ID[deviceId];
  const acts = actionsFor(deviceId);
  const result = ui.lastResult?.length ? `<div class="result-card">
      ${ui.lastResult.slice().reverse().map(l => `<p class="${l.kind}">${l.text}</p>`).join('')}
    </div>` : '';
  return `<div class="tool-panel">
    <div class="tool-panel-head">
      <span class="tool-panel-icon">${svg.icon(d?.icon)}</span>
      <div><h3>${t('What do you want to do with the {tool}?', { tool: t(d?.shelfName || d?.name || '') })}</h3>
      <p>${t(d?.use || '')}</p></div>
    </div>
    ${result}
    <ul class="actions">
      ${acts.map(act => {
        const open = ui.open === act.id;
        const tone = typeof act.tone === 'function' ? act.tone() : act.tone || '';
        return `<li class="action ${open ? 'open' : ''} ${tone}">
          <button class="action-head" data-act="${act.id}" aria-expanded="${open}">
            <span>${actionLabel(act)}</span>
            <span class="action-go">${act.params?.length ? (open ? '▾' : '▸') : '↵'}</span>
          </button>
          ${open ? `<div class="action-body">
            ${act.params.map(k => chipRow(act, k)).join('')}
            <button class="btn primary run" data-run="${act.id}">${t('Do it')}</button>
          </div>` : ''}
        </li>`;
      }).join('')}
    </ul>
  </div>`;
}

// The full bench log, newest first. Every line is listed: this list is the record a
// student gets scored on, so a truncated one hides evidence they still need.
function benchLog() {
  const entries = state.log;
  if (!entries.length) return '';
  return `<details class="station-log" open>
    <summary>${t('Bench log')} <span class="count">${entries.length}</span></summary>
    <ul class="benchlog">${entries.map(l => `<li class="${l.kind}">${l.text}</li>`).join('')}</ul>
  </details>`;
}

function shell(title, deviceId, drawing, hint) {
  const d = DEVICE_BY_ID[ui.device] || DEVICE_BY_ID[deviceId];
  return `<div class="station">
    <header class="station-head">
      <div>
        <h2>${title}</h2>
        ${d?.provided ? `<p class="station-use"><em>${t('provided at the event, not on the equipment list')}</em></p>` : ''}
      </div>
      ${hint ? `<p class="station-hint">${tb(hint)}</p>` : ''}
    </header>
    <div class="split">
      <div class="apparatus-wrap">${drawing}</div>
      <div class="controls">${toolPanel(ui.device)}</div>
    </div>
    ${benchLog()}
  </div>`;
}

function readout(rows) {
  const shown = rows.filter(r => r && r[1] != null && r[1] !== '');
  if (!shown.length) return '';
  return `<dl class="readouts">${shown.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

function toolStates() {
  const rows = ['dropper', 'spatula', 'electrodes'].map(id => {
    const dirty = state.tools[id].contaminatedWith;
    return `<span class="tool-chip ${dirty ? 'dirty' : 'clean'}">${t(id)}: ${dirty ? t('residue from {label}', { label: dirty }) : t('clean')}</span>`;
  });
  const bottles = Object.entries(state.tools.bottles || {});
  if (bottles.length) rows.push(`<span class="tool-chip dirty">${t('contaminated bottles: {list}', { list: bottles.map(([r]) => t(REAGENTS[r].name)).join(', ') })}</span>`);
  return `<div class="tool-chips">${rows.join('')}</div>`;
}

function wellReadout() {
  const w = state.wells[ui.well];
  if (!w?.sample && !w?.label) return `<p class="hint">${t('Well {well} is empty. Click a well to pick it.', { well: ui.well })}</p>`;
  return `<div class="well-readout">
    <strong>${ui.well}${w.label ? ` · ${t('labelled {label}', { label: w.label })}` : ` · ${t('unlabelled')}`}</strong>
    ${w.sample ? `<span>${w.sample}${w.reagent ? ` + ${t(TEST_LABEL[w.reagent])}` : ''}</span>` : ''}
    ${w.result ? `<p>${observationText(w.result)}</p>` : ''}
    ${w.contaminated ? `<p class="flag">${t('This result is unreliable — the tool carried another sample into the well.')}</p>` : ''}
  </div>`;
}

const STATIONS = {

  kit: {
    view: () => {
      const locked = testsStarted();
      return shell(t('Kit box & PPE'), 'kit_box', `
        <div class="ppe-figure">
          ${PPE.map(p => `<div class="ppe-item ${state.ppe[p.id] ? 'on' : ''}">
            <span class="ppe-dot"></span>${t(p.name)}<span class="pts">${t('{n} pt', { n: p.points })}</span></div>`).join('')}
        </div>
        <p class="readout">${t('PPE banked: {earned} of 8', { earned: ppePoints() })}</p>
        <p class="callout">${locked
          ? tb('Expectation 1: PPE is locked. You have already run tests, so supervisors would score you on what you had on when you started — these {n} points are final.', { n: ppePoints() })
          : tb('Expectation 1: supervisors expect you to show up properly attired. PPE points are only banked for what you put on <strong>before</strong> you start running tests.')}</p>`,
        'Start here. Put on PPE, then pick a tool from the shelf.');
    },
  },

  spot_plate: {
    view: () => shell(t('Spot plate — semi-micro tests'), 'spot_plate', `
      ${svg.spotPlateSvg(state.wells, ui.well)}
      ${wellReadout()}
      ${toolStates()}`,
      'Label a well, put one unknown in it, then add one drop of one reagent.'),
  },

  ph: {
    view: () => {
      const target = currentTarget();
      const measured = state.measurements[target]?.ph;
      return shell(t('pH paper / pH meter'), 'ph', `
        ${svg.phStripSvg(measured)}
        ${readout([[t('Evidence'), target], [t('pH'), measured != null ? t('pH ≈ {ph}', { ph: measured }) : t('not measured')]])}`,
        'Never dip the paper into the solution.');
    },
  },

  conductivity: {
    view: () => {
      const target = currentTarget();
      const r = state.observations[target]?.conductivity;
      return shell(t('9V conductivity tester'), 'conductivity', `
        ${svg.conductivitySvg(r?.token)}
        ${readout([[t('Evidence'), target], [t('Bulb'), r ? observationText(r) : t('not tested')]])}
        ${toolStates()}`,
        'Rinse the electrodes between samples or the second reading is the first sample’s.');
    },
  },

  volume: {
    view: () => {
      const v = state.volumeMeasures;
      const target = currentTarget();
      const m = state.measurements[target] || {};
      const capacity = v?.capacity || ui.cylinder;
      return shell(t('Graduated cylinders'), 'graduated_cylinder', `
        ${svg.cylinderSvg({ capacity, view: ui.view, liquidMl: v?.capacity === capacity ? v.value : 0 })}
        ${readout([
          [t('Practice pour'), v ? t('{v} mL in the {capacity} mL cylinder', { v: v.reading ?? '?', capacity: v.capacity }) : null],
          [t('Displacement ({label})', { label: target }), m.v1 != null ? `${m.v0} → ${m.v1} mL` : null],
          [t('Measured out ({label})', { label: target }), m.liquidMl ? `${m.liquidMl.toFixed(1)} mL` : null],
        ])}`,
        'Pick the smallest cylinder that holds the volume, and read at eye level.');
    },
  },

  density: {
    view: () => {
      const target = currentTarget();
      const m = state.measurements[target] || {};
      const bal = state.tools.balance;
      return shell(t('Balance'), 'balance', `
        ${svg.balanceSvg(bal.reading)}
        ${readout([
          [t('Balance'), bal.tared ? t('zeroed with paper') : t('not zeroed')],
          [t('Mass ({label})', { label: target }), m.mass != null ? `${m.mass.toFixed(2)} g` : null],
          [t('Volume ({label})', { label: target }), m.v1 != null ? `${(m.v1 - m.v0).toFixed(1)} mL` : m.liquidMl ? `${m.liquidMl.toFixed(1)} mL` : null],
        ])}
        <p class="callout small">${tb('Density = mass ÷ volume. Get the volume from displacement (solids) or by measuring out 10.0 mL (liquids) with the graduated cylinder.')}</p>`,
        'Zero the balance with the weighing paper on, then weigh.');
    },
  },

  chromatography: {
    view: () => {
      const c = latestChromatogram();
      const src = inkSource(currentInk());
      return shell(t('Paper chromatography'), 'petri_dish', `
        ${c ? svg.chromatogramSvg(c) : `<div class="empty-strip">${t('No strip developed yet for {ink} in {solvent}', { ink: src?.label, solvent: t(SOLVENTS[ui.solvent].name) })}</div>`}
        ${readout([
          [t('Baseline'), state.chromaPrep.baseline ? t(state.chromaPrep.baseline === 'pen' ? 'pen — will run' : 'pencil') : t('not drawn')],
          [t('Showing'), `${src?.label} · ${t(SOLVENTS[ui.solvent].name)}`],
          [t('Measured'), c?.measured ? t('front {front} mm; spots {spots} mm', { front: c.measured.front, spots: c.measured.dyes.join(', ') }) : null],
        ])}
        <p class="callout small">${tb('Rf = distance the spot travelled ÷ distance the solvent front travelled, both measured from the baseline.')}</p>`,
        'Pencil baseline → develop with the solvent below it → measure with the ruler.');
    },
  },

  microscope: {
    view: () => {
      const m = state.microscope;
      const s = m ? BY_ID[m.sampleId] : null;
      let drawing = `<div class="empty-strip">${t('No slide prepared')}</div>`;
      if (m && s?.microData) drawing = svg.microscopeSvg({ sample: s, magnification: ui.magnification, bubbles: m.bubbles, measured: m.measured });
      else if (m && s) drawing = `<div class="lens-view">${state.observations[m.label]?.micro ? observationText(state.observations[m.label].micro) : t('{label} on the slide — measure it to record what you see', { label: m.label })}</div>`;
      const md = m ? state.measurements[m.label] || {} : {};
      return shell(t('Slide, cover slip, and microscope'), 'microscope', `
        ${drawing}
        ${readout([
          [t('Slide'), m ? m.label : null],
          [t('Cover slip'), m ? (m.cover ? t(m.cover === 'angle' ? 'lowered at 45°' : 'dropped flat — bubbles') : t('none yet')) : null],
          [t('Magnification'), `${ui.magnification}×`],
          [t('Hair diameter'), md.diaUm != null ? `${md.diaUm} µm` : null],
          [t('Medulla width'), md.medUm != null ? `${md.medUm} µm` : null],
        ])}
        <p class="callout small">${tb('Medulla index = medulla width ÷ hair diameter. Human hair is under about 0.33; most animal hair is above 0.5.')}</p>`,
        'Mount → cover slip at 45° → 40× → measure.');
    },
  },

  magnify: {
    view: () => {
      const target = currentTarget();
      const r = state.observations[target]?.appearance;
      return shell(t('Hand lens'), 'hand_lens', `
        <div class="lens-view round">${r ? observationText(r) : t('Pick an item and examine it')}</div>
        ${readout([[t('Evidence'), target]])}`, 'Look before you test.');
    },
  },

  test_tube: {
    view: () => {
      const tube = state.tools.tube;
      const fill = Math.round(tube.filledFraction * 100);
      const drawing = ui.device === 'test_tube_rack'
        ? `<div class="rack">
            ${[0, 1, 2, 3, 4].map(i => `<div class="tube ${i === 2 ? '' : 'rack-empty'} ${tube.filledFraction > 0.33 ? 'overfilled' : ''}">
              ${i === 2 ? `<div class="tube-liquid" style="height:${fill}%"></div>` : ''}
            </div>`).join('')}
          </div>`
        : `<div class="tube-rack">
            <div class="tube-mount ${tube.aimedAway ? 'aim-away' : 'aim-people'}">
              <div class="tube ${tube.filledFraction > 0.33 ? 'overfilled' : ''}">
                <div class="tube-liquid" style="height:${fill}%"></div>
              </div>
              <div class="tube-clamp ${tube.clampedTop ? 'top' : 'middle'}"></div>
            </div>
          </div>`;
      return shell(t('Test tube — mixing and heating'), 'test_tube', `
        ${drawing}
        ${readout([
          [t('Contents'), tube.contents ? `${tube.contents} · ${fill}%` : t('empty')],
          [t('Clamp'), tube.clampedTop ? t('near the top') : `<span class="warn">${t('in the middle')}</span>`],
          [t('Aimed'), tube.aimedAway ? t('away from people') : `<span class="warn">${t('toward people')}</span>`],
        ])}
        <p class="callout small">${tb('Expectation 2 covers heating safely. Clamp the upper third of the tube, hold it at about 45°, pointed away from people. An overfilled tube boils over.')}</p>`,
        'One third full, clamped near the top, pointed away from people.');
    },
  },

  burn: {
    view: () => {
      const target = currentTarget();
      const r = state.burnResults[target];
      return shell(t('Burn test'), 'heat_source', `
        ${svg.burnSvg(r)}
        ${r ? `<div class="burn-card">
          <p><strong>${t('Speed:')}</strong> ${t(r.speed)}</p>
          <p><strong>${t('Odour:')}</strong> ${t(r.odor)}</p>
          <p><strong>${t('Residue:')}</strong> ${t(r.residue)}</p>
          <p class="proxy">${tb('Odour is shown as a written comparison — a browser cannot deliver smell. Treat it as a reference card, not as a real observation.')}</p>
        </div>` : readout([[t('Evidence'), target], [t('Result'), t('not burned yet')]])}`,
        'Tweezers, in the hood, with goggles on.');
    },
  },

  magnet: {
    view: () => {
      const target = currentTarget();
      const r = state.observations[target]?.magnet;
      return shell(t('Magnets'), 'magnet', `
        <div class="lens-view">${r ? observationText(r) : t('No magnet test recorded')}</div>
        ${readout([[t('Evidence'), target]])}`, 'Wrap the magnet in paper so the filings come off cleanly.');
    },
  },

  temperature: {
    view: () => {
      const target = currentTarget();
      const m = state.measurements[target] || {};
      return shell(t('Thermometer'), 'thermometer', `
        ${svg.thermometerSvg(m.temp)}
        ${readout([[t('Evidence'), target], [t('Temperature'), m.temp != null ? `${m.temp.toFixed(1)} °C` : null]])}`,
        'A thermometer is not a stirring rod.');
    },
  },

  clean: {
    view: () => shell(t('Cleaning and decontamination'), 'paper_towels', `
      ${toolStates()}
      <div class="tool-chips">
        <span class="tool-chip ${state.tools.tube.filledFraction ? 'dirty' : 'clean'}">${t('tube')}: ${state.tools.tube.filledFraction ? t('still holding {label}', { label: state.tools.tube.contents || '?' }) : t('clean')}</span>
      </div>
      <p class="callout">${tb('Half the wrong answers in this event come from carrying one sample into another. This station is where you undo that.')}</p>`,
      'Between every unknown, every tool.'),
  },

  beaker: {
    view: () => {
      const target = currentTarget();
      const r = state.observations[target]?.float;
      return shell(t('Beakers'), 'beaker', `
        ${svg.beakerSvg(r?.token)}
        ${readout([[t('Evidence'), target], [t('Float test'), r ? observationText(r) : null]])}
        <p class="callout small">${tb('Beaker graduations are good to roughly 5%. Use one for reactions, float tests and chromatogram development, never for a volume you have to report.')}</p>`,
        'Reactions and developing chromatograms, not measuring.');
    },
  },

  flask: {
    view: () => shell(t('Erlenmeyer flask'), 'erlenmeyer', `
      <div class="lens-view">${t(FLASK_MIX[ui.flaskMix])}</div>
      <p class="callout">${tb('The narrow neck exists so you can mix by swirling without losing sample or letting it spatter.')}</p>`, 'Mix by swirling.'),
  },

  retrieve: {
    view: () => shell(t('Tongs, forceps, tweezers'), 'tweezers', `
      ${svg.burnSvg(state.burnResults[currentTarget()])}
      ${readout([[t('Retrieved'), state.retrieved.done ? t('fragment on the labelled tray') : t('nothing yet')]])}
      <p class="callout">${tb('Tweezers hold burn samples and retrieve evidence from liquids. Retrieved evidence goes on its own labelled surface.')}</p>`, 'Hold and retrieve without touching.'),
  },
};

Object.assign(LAB, { ui: ui, unknowns: unknowns, sampleFor: sampleFor, categoryFor: categoryFor, STATIONS: STATIONS, TOOLS: TOOLS, actionsFor: actionsFor, runAction: runAction, toggleAction: toggleAction, setParam: setParam, inkSource: inkSource, inkSources: inkSources });
})(window.LAB);
