(function (LAB) {
'use strict';

const { state, commit, note, markTechnique, useTool, cleanTool, recordObservation, recordMeasurement, ppePoints, observationText } = LAB;
const { REAGENTS, TESTS, BY_ID, resolveResult, INK_BY_ID, SOLVENTS, inksMatch, labelFor } = LAB;
const { DEVICE_BY_ID, PPE } = LAB;
const svg = LAB.svg;
const { t, tb } = LAB;

const ui = {
  station: 'kit', device: 'kit_box', target: null, well: 'A1', inkId: null, solvent: 'water',
  reagent: 'water', magnification: 40, cylinder: 100, view: 'top', developed: false,
  burnArmed: false, flaskMix: null, form: {},
};

const FLASK_MIX = { null: 'Nothing mixed yet', swirl: 'Swirling the flask to mix', stir: 'Stirring with a rod' };

// The stage is rebuilt after every action, so a control's value has to live in ui or
// it silently reverts mid-calculation — a chosen reagent snapping back to water, a
// typed mass vanishing before you can divide by it.
function typed(id, fallback = '') {
  const v = ui.form[id];
  return v == null ? fallback : v;
}

function checked(id, fallback = false) {
  const v = ui.form[id];
  return (v == null ? fallback : v) ? 'checked' : '';
}

function unknowns() { return state.unknowns || []; }
function sampleFor(label) {
  const u = unknowns().find(x => x.label === label);
  return u ? BY_ID[u.sampleId] : null;
}
function categoryFor(label) {
  const u = unknowns().find(x => x.label === label);
  return u?.category;
}

const TEST_LABEL = Object.fromEntries(TESTS.map(x => [x.id, x.label]));

// PPE is graded on what you were wearing when you started, so the kit box stops
// accepting new gear once the first test is on the record.
function testsStarted() { return Object.keys(state.observations).length > 0; }

// Scrubbing empties the tube. It deliberately does not touch the dropper or the
// spatula: those are the tools the contamination model tracks, and cleaning them
// here would scrub away a cross-contamination the student is meant to be marked for.
function scrubTube() {
  const tube = state.tools.tube;
  if (!tube.filledFraction) { note(t('The tube is already empty and clean'), 'info'); return; }
  tube.filledFraction = 0;
  note(t('Tube scrubbed clean'), 'good');
}

// The log is the last thing on the station page, below the drawing. Nothing scrolls to it
// after an action: a page that jumps to the bottom loses the drawing you were looking at.
// Every line is listed: this list is the record a student gets scored on, so a truncated
// one hides evidence they still need.
function benchLog() {
  const entries = state.log;
  if (!entries.length) return '';
  return `<section class="station-log">
    <h3>${t('Bench log')}</h3>
    <ul class="benchlog">${entries.map(l => `<li class="${l.kind}">${l.text}</li>`).join('')}</ul>
  </section>`;
}

function shell(title, deviceId, body, hint) {
  const d = DEVICE_BY_ID[deviceId];
  return `<div class="station">
    <header class="station-head">
      <h2>${title}</h2>
      ${d ? `<p class="station-use"><strong>${t(d.name)}</strong> · ${t(d.use)}${d.provided ? ` · <em>${t('provided at the event, not on the equipment list')}</em>` : ''}</p>` : ''}
      ${hint ? `<p class="station-hint">${tb(hint)}</p>` : ''}
    </header>
    <div class="station-body">${body}</div>
    ${benchLog()}
  </div>`;
}

function targetPicker(selected) {
  const opts = unknowns().map(u =>
    `<option value="${u.label}" ${u.label === selected ? 'selected' : ''}>${u.label} — ${labelFor(u.category)}</option>`).join('');
  return `<label class="field"><span>${t('Working on')}</span><select id="target">${opts}</select></label>`;
}

function btn(action, label, cls = '') {
  return `<button class="btn ${cls}" data-action="${action}">${label}</button>`;
}

// A setting button, unlike an action button, has to show which way the setting
// already sits — otherwise clicking the one that is already right looks broken.
function toggle(action, label, on) {
  return `<button class="btn ${on ? 'on' : ''}" data-action="${action}" aria-pressed="${on}">${label}</button>`;
}

function wellColor(result, reagentId) {
  if (!result) return REAGENTS[reagentId]?.color || '#f4f7fa';
  const tok = result.token;
  if (tok === 'starch positive') return '#2b3a67';
  if (tok === 'bleaches') return '#f7fbfd';
  if (tok === 'precipitate') return '#e8e2d6';
  if (tok === 'effervesce') return '#e4f1f8';
  if (tok === 'weak positive') return '#e9e2f0';
  return REAGENTS[reagentId]?.color || '#f4f7fa';
}

// ─────────────────────────────────────────────────────────────
const STATIONS = {

  kit: {
    title: 'Kit box & PPE',
    view: () => {
      const locked = testsStarted();
      return shell(t('Kit box & PPE'), 'kit_box', `
      <div class="ppe-grid">
        ${PPE.map(p => `<label class="ppe-item ${state.ppe[p.id] ? 'on' : ''}">
          <input type="checkbox" data-action="ppe" data-ppe="${p.id}" ${state.ppe[p.id] ? 'checked' : ''} ${locked ? 'disabled' : ''}/> ${t(p.name)}
          <span class="pts">${t('{n} pt', { n: p.points })}</span></label>`).join('')}
      </div>
      <p class="readout">${t('PPE banked: {earned} of 8', { earned: ppePoints() })}</p>
      <p class="callout">${locked
        ? tb('Expectation 1: PPE is locked. You have already run tests, so supervisors would score you on what you had on when you started — these {n} points are final.', { n: ppePoints() })
        : tb('Expectation 1: supervisors expect you to show up properly attired. PPE points are only banked for what you put on <strong>before</strong> you start running tests.')}</p>
      <div class="inventory">
        <h3>${t('What is on the shelf')}</h3>
        <p>${tb('Every item below is from the Division B Chemistry Lab Equipment List. Each one has a technique the event actually scores.')}</p>
      </div>`,
      'Start here. Put on PPE, then work left to right along the shelf.');
    },
    action(name, data) {
      if (name !== 'ppe') return;
      const item = PPE.find(p => p.id === data.ppe);
      if (!item) return;
      if (testsStarted()) {
        note(t('PPE locked: {item} would not count — you had already run a test without it', { item: t(item.name) }), 'bad');
        return;
      }
      state.ppe[item.id] = !state.ppe[item.id];
      note(state.ppe[item.id] ? t('Put on {item}', { item: t(item.name.toLowerCase()) }) : t('Took off {item}', { item: t(item.name.toLowerCase()) }),
        state.ppe[item.id] ? 'good' : 'info');
    },
  },

  spot_plate: {
    title: 'Spot plate',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      return shell(t('Spot plate — semi-micro tests'), 'spot_plate', `
        <div class="split">
          <div class="apparatus-wrap">${svg.spotPlateSvg(state.wells, ui.well)}</div>
          <div class="controls">
            ${targetPicker(target)}
            <label class="field"><span>${t('Reagent')}</span><select id="reagent">
              ${Object.values(REAGENTS).map(r => `<option value="${r.id}" ${r.id === ui.reagent ? 'selected' : ''}>${t(r.name)}</option>`).join('')}
            </select></label>
            <label class="field check"><input type="checkbox" id="labelWell" ${checked('labelWell')}/> ${t('Label the well first')}</label>
            <label class="field check"><input type="checkbox" id="touchTip" ${checked('touchTip')}/> ${t('Touch the dropper tip to the sample')}</label>
            <div class="btn-row">
              ${btn('addSample', t('Add sample to well'))}
              ${btn('addReagent', t('Add reagent to well'), 'primary')}
            </div>
            <div class="btn-row">
              ${btn('rinseDropper', t('Rinse dropper'))}
              ${btn('cleanSpatula', t('Clean spatula'))}
              ${btn('floodWell', t('Add far too much of both'))}
            </div>
            <p class="callout small">${tb('Solids go in with the spatula, liquids with the dropper. A tool that has touched one unknown carries it into the next well.')}</p>
          </div>
        </div>
        ${wellReadout()}`,
        'Pick a well, put one unknown in it, then add one reagent. One drop of each.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value || ui.target;
      ui.target = target;
      const well = state.wells[ui.well] ||= {};
      const sample = sampleFor(target);

      if (name === 'addSample') {
        const isSolid = ['white_powder', 'metal', 'glass', 'soil', 'plastic', 'tablet', 'fiber', 'hair'].includes(categoryFor(target));
        const tool = isSolid ? 'spatula' : 'dropper';
        const res = useTool(tool, target);
        well.sample = target;
        well.label = (stage.querySelector('#labelWell')?.checked) ? target : null;
        if (stage.querySelector('#labelWell')?.checked) markTechnique('label_wells', true);
        well.contaminated = !res.ok;
      }

      if (name === 'addReagent') {
        if (!well.sample) { note(t('Add a sample to the well before adding a reagent'), 'bad'); commit(); return; }
        const reagentId = stage.querySelector('#reagent')?.value || ui.reagent;
        const s = sampleFor(well.sample);
        const result = resolveResult(s, reagentId);
        if (!result) { note(t('{test} tells you nothing about {sample}', { test: t(TEST_LABEL[reagentId]), sample: well.sample }), 'info'); commit(); return; }
        const tool = ['white_powder', 'metal', 'glass', 'soil', 'plastic', 'tablet', 'fiber', 'hair'].includes(categoryFor(well.sample)) ? 'spatula' : 'dropper';
        const used = useTool(tool, well.sample);
        if (stage.querySelector('#touchTip')?.checked) {
          markTechnique('tip_not_touched', false);
          note(t('The dropper tip touched the sample — the reagent bottle is contaminated for everyone after you'), 'bad');
        } else {
          markTechnique('tip_not_touched', true);
        }
        if (!well.label) markTechnique('label_wells', false);
        well.reagent = reagentId;
        well.mixColor = wellColor(result, reagentId);
        well.bubbles = result.token === 'effervesce';
        well.precipitate = result.token === 'precipitate' ? '#cfc7b8' : null;
        well.result = result;
        recordObservation(well.sample, reagentId, result, { valid: used.ok && !well.contaminated });
      }

      if (name === 'floodWell') {
        markTechnique('one_drop_each', false);
        note(t('Overfilled the well — semi-micro scale exists to keep reagent use small'), 'bad');
      }
      if (name === 'rinseDropper') { cleanTool('dropper'); markTechnique('rinsed_between_samples', true); }
      if (name === 'cleanSpatula') { cleanTool('spatula'); markTechnique('cleaned_between_samples', true); }
    },
  },

  ph: {
    title: 'pH',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const measured = state.measurements[target]?.ph;
      return shell(t('pH paper / pH meter'), 'ph', `
        <div class="split">
          <div class="apparatus-wrap">${svg.phStripSvg(measured)}</div>
          <div class="controls">
            ${targetPicker(target)}
            <div class="btn-row">
              ${btn('phDrop', t('Put a drop in a well, touch the paper to it'), 'primary')}
              ${btn('phDip', t('Dip the paper straight into the sample'))}
            </div>
            <div class="btn-row">${btn('phMeter', t('Use the pH meter instead'))}</div>
            <p class="callout small">${tb('Dipping the paper puts the indicator into your sample and ruins it. Expectation 4 grades you on using the instrument correctly, not just on getting a number.')}</p>
          </div>
        </div>
        ${measured != null ? `<p class="readout">${target} · ${t('pH ≈ {ph}', { ph: measured })}</p>` : ''}`,
        'Never dip the paper into the solution.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      const s = sampleFor(target);
      if (!s || s.ph == null) { note(t('This sample has no meaningful pH'), 'info'); commit(); return; }
      if (name === 'phDip') {
        markTechnique('no_dipping', false);
        recordObservation(target, 'ph', resolveResult(s, 'ph'), { valid: false });
        recordMeasurement(target, 'ph', s.ph);
      }
      if (name === 'phDrop' || name === 'phMeter') {
        recordObservation(target, 'ph', resolveResult(s, 'ph'));
        recordMeasurement(target, 'ph', s.ph);
      }
    },
  },

  conductivity: {
    title: 'Conductivity',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const level = state.observations[target]?.conductivity?.token;
      return shell(t('9V conductivity tester'), 'conductivity', `
        <div class="split">
          <div class="apparatus-wrap">${svg.conductivitySvg(level)}</div>
          <div class="controls">
            ${targetPicker(target)}
            <div class="btn-row">
              ${btn('condTest', t('Test the sample'), 'primary')}
              ${btn('condTouch', t('Let the electrodes touch'))}
              ${btn('condRinse', t('Rinse the electrodes'))}
            </div>
            <p class="callout small">${tb('Ionic strength separates salt water from sugar water when every other test says the same thing.')}</p>
          </div>
        </div>`,
        'Rinse the electrodes between samples or the second reading is the first sample’s.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      const s = sampleFor(target);
      if (name === 'condTouch') { markTechnique('electrodes_apart', false); return; }
      if (name === 'condRinse') { cleanTool('electrodes'); markTechnique('rinsed_electrodes', true); return; }
      if (name === 'condTest') {
        if (!s?.conductivity) { note(t('This sample cannot be tested for conductivity'), 'info'); return; }
        const used = useTool('electrodes', target);
        markTechnique('electrodes_apart', true);
        recordObservation(target, 'conductivity', resolveResult(s, 'conductivity'), { valid: used.ok });
      }
    },
  },

  volume: {
    title: 'Graduated cylinders',
    view: () => {
      const target = 8;
      // A pour belongs to the cylinder it was poured into; switching cylinders
      // empties the drawing, because in the lab you would have to pour again.
      const poured = state.volumeMeasures?.capacity === ui.cylinder ? state.volumeMeasures.value : 0;
      return shell(t('Graduated cylinders'), 'graduated_cylinder', `
        <div class="split">
          <div class="apparatus-wrap">${svg.cylinderSvg({ capacity: ui.cylinder, view: ui.view, liquidMl: poured })}</div>
          <div class="controls">
            <p class="task">${tb('Measure out {n} mL of water.', { n: target })}</p>
            <label class="field"><span>${t('Cylinder')}</span><select id="cyl">
              ${[10, 25, 50, 100].map(c => `<option value="${c}" ${c === ui.cylinder ? 'selected' : ''}>${c} mL</option>`).join('')}
            </select></label>
            <div class="btn-row">
              ${btn('viewEye', t('Crouch to eye level'), 'primary')}
              ${btn('viewTop', t('Read from above'))}
            </div>
            <div class="btn-row">${btn('pour', t('Pour to the mark'))}</div>
            <label class="field"><span>${t('Your reading (mL)')}</span><input id="volRead" type="number" step="0.1" inputmode="decimal" placeholder="8.0" value="${typed('volRead')}"/></label>
            ${btn('volRecord', t('Record the reading'))}
            <p class="callout small">${tb('Reading from above shifts the meniscus. Picking a 100 mL cylinder for 8 mL costs you precision.')}</p>
          </div>
        </div>`,
        'Expectation 4: the instrument has to be used correctly, not just present.');
    },
    action(name, data, stage) {
      if (name === 'viewEye') { ui.view = 'eye'; markTechnique('meniscus_eye_level', true); }
      if (name === 'viewTop') { ui.view = 'top'; markTechnique('meniscus_eye_level', false); }
      if (name === 'pour') {
        state.volumeMeasures = { value: 8, capacity: ui.cylinder };
        const c = parseInt(stage.querySelector('#cyl')?.value || ui.cylinder, 10);
        ui.cylinder = c;
        if (c > 25) markTechnique('cylinder_size_match', false);
        else markTechnique('cylinder_size_match', true);
      }
      if (name === 'volRecord') {
        const v = parseFloat(stage.querySelector('#volRead')?.value);
        if (Number.isNaN(v)) { note(t('Enter a volume before recording'), 'bad'); return; }
        const error = Math.abs(v - 8);
        const parallax = ui.view === 'top' ? 1.4 : 0;
        note(t('Volume recorded as {v} mL. True volume 8.0 mL; your error {error} mL{parallax}',
          { v, error: error.toFixed(1), parallax: parallax ? ` ${t('(parallax from reading above the meniscus)')}` : '' }), error <= 0.2 ? 'good' : 'bad');
      }
    },
  },

  chromatography: {
    title: 'Chromatography',
    view: () => {
      const inks = state.case?.chromatography
        ? [INK_BY_ID[state.case.chromatography.questionedInkId], ...state.case.suspects.map(s => INK_BY_ID[s.inkId])]
        : Object.values(INK_BY_ID).slice(0, 4);
      const seen = new Set();
      const inkOptions = inks.filter(i => i && !seen.has(i.id) && seen.add(i.id));
      ui.inkId ||= inkOptions[0]?.id;
      const current = state.chromatograms.find(c => c.inkId === ui.inkId && c.solvent === ui.solvent);
      return shell(t('Paper chromatography — strip and sheet'), 'pencil', `
        <div class="split">
          <div class="apparatus-wrap">${current ? svg.chromatogramSvg(current) : `<div class="empty-strip">${t('No strip developed yet')}</div>`}</div>
          <div class="controls">
            <label class="field"><span>${t('Ink')}</span><select id="ink">
              ${inkOptions.map(i => `<option value="${i.id}" ${i.id === ui.inkId ? 'selected' : ''}>${t(i.label)}</option>`).join('')}
            </select></label>
            <label class="field"><span>${t('Solvent')}</span><select id="solvent">
              ${Object.values(SOLVENTS).map(s => `<option value="${s.id}" ${s.id === ui.solvent ? 'selected' : ''}>${t(s.name)}</option>`).join('')}
            </select></label>
            <div class="btn-row">
              ${btn('markPencil', t('Mark baseline in pencil'), 'primary')}
              ${btn('markPen', t('Mark baseline in pen'))}
            </div>
            <div class="btn-row">
              ${btn('developStrip', t('Develop the strip (petri dish)'))}
              ${btn('developSheet', t('Develop in a beaker (sheet)'))}
            </div>
            ${current && !current.measured ? measureForm(current) : ''}
            <p class="callout small">${tb('Pen ink dissolves and runs with the solvent, destroying the strip. Expectation 3 covers both strip and sheet development and Rf calculation.')}</p>
          </div>
        </div>
        ${chromatogramTable()}`,
        'Pencil baseline, solvent below the baseline, measure from the baseline.');
    },
    action(name, data, stage) {
      ui.inkId = stage.querySelector('#ink')?.value || ui.inkId;
      ui.solvent = stage.querySelector('#solvent')?.value || ui.solvent;
      const ink = INK_BY_ID[ui.inkId];

      if (name === 'markPencil') { markTechnique('pencil_not_pen', true); note(t('Baseline marked in pencil on the strip'), 'good'); }
      if (name === 'markPen') { markTechnique('pencil_not_pen', false); }

      if (name === 'developStrip' || name === 'developSheet') {
        const usedPen = state.technique.pencil_not_pen === 'false' || state.technique.pencil_not_pen === 'failed';
        const frontMm = 52;
        const spread = usedPen ? 0.35 : 1;
        const dyes = ink.dyes.map(d => ({
          name: d.name, color: d.color,
          mm: Math.round(d.rf[ui.solvent] * frontMm * (usedPen ? spread : 1)),
          rf: d.rf[ui.solvent] * (usedPen ? spread : 1),
        }));
        state.chromatograms.push({
          id: `c${state.chromatograms.length + 1}`, inkId: ink.id, inkLabel: ink.label,
          solvent: ui.solvent, frontMm, dyes, usedPen, measured: false,
          method: name === 'developSheet' ? 'sheet' : 'strip',
        });
        note(t('Developed {ink} in {solvent} ({method}), solvent front {mm} mm',
          { ink: t(ink.label), solvent: t(SOLVENTS[ui.solvent].name), method: name === 'developSheet' ? t('sheet') : t('strip'), mm: frontMm }), 'info');
      }

      if (name === 'measureRf') {
        const front = parseFloat(stage.querySelector('#frontMm')?.value);
        const dyeMm = parseFloat(stage.querySelector('#dyeMm')?.value);
        if (Number.isNaN(front) || Number.isNaN(dyeMm)) { note(t('Enter both distances before calculating Rf'), 'bad'); return; }
        const fromBaseline = stage.querySelector('#fromBaseline')?.checked;
        markTechnique('measure_from_baseline', fromBaseline);
        markTechnique('mm_precision', Number.isInteger(front) && Number.isInteger(dyeMm));
        const c = state.chromatograms[state.chromatograms.length - 1];
        if (c) { c.measured = true; c.measuredRf = dyeMm / front; }
        note(t('Rf = {dyeMm} mm ÷ {front} mm = {rf}', { dyeMm, front, rf: (dyeMm / front).toFixed(2) }), 'good');
      }
    },
  },

  microscope: {
    title: 'Microscope',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const s = sampleFor(target);
      const m = state.microscope;
      return shell(t('Slide, cover slip, and microscope'), 'microscope', `
        <div class="split">
          <div class="apparatus-wrap">${m?.prepared && s ? svg.microscopeSvg({ sample: s, magnification: ui.magnification, bubbles: m.bubbles }) : `<div class="empty-strip">${t('No slide prepared')}</div>`}</div>
          <div class="controls">
            ${targetPicker(target)}
            <div class="btn-row">
              ${btn('mountSlide', t('Mount the sample on a slide'), 'primary')}
              ${btn('coverAngle', t('Lower the cover slip at an angle'), 'primary')}
              ${btn('coverFlat', t('Drop the cover slip flat'))}
            </div>
            <div class="btn-row">
              ${toggle('mag10', t('Hand lens 10×'), ui.magnification === 10)}
              ${toggle('mag40', t('Microscope 40×'), ui.magnification === 40)}
            </div>
            ${m?.prepared ? `
            <label class="field"><span>${t('Hair diameter (µm)')}</span><input id="diaUm" type="number" inputmode="decimal" placeholder="${s?.microData?.diameterUm ?? ''}" value="${typed('diaUm')}"/></label>
            <label class="field"><span>${t('Medulla width (µm)')}</span><input id="medUm" type="number" inputmode="decimal" placeholder="${s?.microData?.medullaUm ?? ''}" value="${typed('medUm')}"/></label>
            ${btn('calcMedulla', t('Calculate medulla index'))}` : ''}
            <p class="callout small">${tb('Slides and cover slips are on the equipment list; the microscope itself is provided at the event. Confirm this against the current manual.')}</p>
          </div>
        </div>`,
        'Measure the medulla index: medulla width divided by hair diameter.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      const s = sampleFor(target);
      if (name === 'mountSlide') {
        state.microscope = { prepared: true, bubbles: false, label: target, sampleId: s?.id };
        note(t('Mounted {label} on a slide', { label: target }), 'info');
      }
      if (name === 'coverAngle') { markTechnique('lower_cover_45', true); if (state.microscope) state.microscope.bubbles = false; }
      if (name === 'coverFlat') { markTechnique('lower_cover_45', false); if (state.microscope) state.microscope.bubbles = true; }
      if (name === 'mag10') ui.magnification = 10;
      if (name === 'mag40') ui.magnification = 40;
      if (name === 'calcMedulla') {
        const dia = parseFloat(stage.querySelector('#diaUm')?.value);
        const med = parseFloat(stage.querySelector('#medUm')?.value);
        if (!dia || !med) { note(t('Enter both measurements'), 'bad'); return; }
        const idx = med / dia;
        recordMeasurement(target, 'medullaIndex', idx);
        recordObservation(target, 'micro', resolveResult(s, 'micro'));
        note(t('{label} medulla index = {idx}', { label: target, idx: idx.toFixed(2) }), 'good');
      }
    },
  },

  magnify: {
    title: 'Hand lens',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const s = sampleFor(target);
      return shell(t('Hand lens'), 'hand_lens', `
        <div class="split">
          <div class="apparatus-wrap"><div class="lens-view">${s ? t(s.appearance) : t('Nothing selected')}</div></div>
          <div class="controls">
            ${targetPicker(target)}
            <div class="btn-row">${btn('recordAppearance', t('Record what you see'), 'primary')}</div>
            <p class="callout small">${tb('Crystal shape, luster, and colour identify powders and glass before you spend reagent on them.')}</p>
          </div>
        </div>`, 'Look before you test.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      const s = sampleFor(target);
      if (name === 'recordAppearance' && s) recordObservation(target, 'appearance', resolveResult(s, 'appearance'));
    },
  },

  test_tube: {
    title: 'Test tubes',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const tube = state.tools.tube;
      const fill = Math.round(tube.filledFraction * 100);
      const fillRow = `<div class="btn-row">
              ${btn('fillQuarter', t('Fill one quarter'), 'primary')}
              ${btn('fillFull', t('Fill to the top'))}
            </div>`;
      const clampRow = `<div class="btn-row">
              ${toggle('clampTop', t('Clamp near the top'), tube.clampedTop)}
              ${toggle('clampMiddle', t('Clamp in the middle'), !tube.clampedTop)}
            </div>`;
      const aimRow = `<div class="btn-row">
              ${toggle('aimAway', t('Point it away from people'), tube.aimedAway)}
              ${toggle('aimPeople', t('Point it at your partner'), !tube.aimedAway)}
            </div>`;
      const heatRow = `<div class="btn-row">${btn('heatTube', t('Heat it'), 'primary')} ${btn('brushTube', t('Scrub the tube clean'))}</div>`;
      const heatCallout = tb('Expectation 2 covers heating safely. Clamp the upper third of the tube, close to the open end but below the rim: that keeps the clamp out of the hottest part and lets the lower portion heat evenly. Hold the tube at about 45°, pointed away from people. An overfilled tube boils over.');

      // Test Tubes, Test Tube Holder and Test Tube Rack all act on the same tube, but they
      // are three different pieces of kit. All three used to open the identical page, which
      // said nothing about what a rack is for.
      if (ui.device === 'test_tube_rack') {
        return shell(t('Test tube rack'), 'test_tube_rack', `
          <div class="split">
            <div class="apparatus-wrap"><div class="rack">
              ${[0, 1, 2, 3, 4].map(i => `<div class="tube ${i === 2 ? '' : 'rack-empty'} ${tube.filledFraction > 0.33 ? 'overfilled' : ''}">
                ${i === 2 ? `<div class="tube-liquid" style="height:${fill}%"></div>` : ''}
              </div>`).join('')}
            </div>
            <p class="apparatus-label">${t('the tube you are working with, standing in the rack')}</p></div>
            <div class="controls">
              ${targetPicker(target)}
              ${fillRow}
              <div class="btn-row">${btn('brushTube', t('Scrub the tube clean'))}</div>
              <p class="callout small">${tb('The rack holds tubes upright so a partly-filled tube stays put while you mix it or let it settle. A tube in the rack is not being heated: pick it up, clamp the upper third and hold it at about 45° only when it is over the heat — that is the Test Tube Holder page.')}</p>
            </div>
          </div>`, 'Standing upright: not clamped, not heated.');
      }

      if (ui.device === 'test_tube_holder') {
        return shell(t('Test tube holder — where to clamp'), 'test_tube_holder', `
          <div class="split">
            <div class="apparatus-wrap"><div class="tube-compare">
              <div class="tube-choice ${tube.clampedTop ? 'picked' : ''}">
                <div class="tube-mount">
                  <div class="tube"><div class="tube-liquid" style="height:${fill}%"></div></div>
                  <div class="tube-clamp top"></div>
                </div>
                <p class="apparatus-label">${t('near the top')}</p>
              </div>
              <div class="tube-choice ${tube.clampedTop ? '' : 'picked'}">
                <div class="tube-mount">
                  <div class="tube"><div class="tube-liquid" style="height:${fill}%"></div></div>
                  <div class="tube-clamp middle"></div>
                </div>
                <p class="apparatus-label warn">${t('in the middle')}</p>
              </div>
            </div></div>
            <div class="controls">
              ${targetPicker(target)}
              ${clampRow}
              ${aimRow}
              ${heatRow}
              <p class="callout small">${heatCallout}</p>
            </div>
          </div>`, 'The holder grips the upper third; the red clamp is the mistake.');
      }

      return shell(t('Test tube — mixing and heating'), 'test_tube', `
        <div class="split">
          <div class="apparatus-wrap"><div class="tube-rack">
            <div class="tube-mount">
              <div class="tube ${tube.filledFraction > 0.33 ? 'overfilled' : ''}">
                <div class="tube-liquid" style="height:${fill}%"></div>
              </div>
              <div class="tube-clamp ${tube.clampedTop ? 'top' : 'middle'}"></div>
            </div>
            <p class="apparatus-label ${tube.clampedTop ? '' : 'warn'}" data-part="clamp">${t('clamped')} ${tube.clampedTop ? t('near the top') : t('in the middle')}</p>
            <p class="apparatus-label ${tube.aimedAway ? '' : 'warn'}" data-part="aim">${t('aimed')} ${tube.aimedAway ? t('away from people') : t('toward people')}</p>
          </div></div>
          <div class="controls">
            ${targetPicker(target)}
            ${fillRow}
            ${clampRow}
            ${aimRow}
            ${heatRow}
            <p class="callout small">${heatCallout}</p>
          </div>
        </div>`, 'One third full, clamped near the top, pointed away from people.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      const tube = state.tools.tube;
      if (name === 'fillQuarter') tube.filledFraction = 0.25;
      if (name === 'fillFull') tube.filledFraction = 0.95;
      // Clamping and aiming are settings you can still fix, so they move the tube and
      // are graded at the one moment they matter — when you heat. Grading them on click
      // meant a wrong first click was permanent and the log contradicted the drawing.
      if (name === 'clampTop') tube.clampedTop = true;
      if (name === 'clampMiddle') tube.clampedTop = false;
      if (name === 'aimAway') tube.aimedAway = true;
      if (name === 'aimPeople') tube.aimedAway = false;
      if (name === 'heatTube') {
        if (!tube.filledFraction) { note(t('Nothing in the tube to heat'), 'info'); return; }
        markTechnique('heat_fill_third', tube.filledFraction <= 0.33);
        markTechnique('clamp_top', tube.clampedTop);
        markTechnique('heat_aim_away', tube.aimedAway);
        const s = sampleFor(target);
        if (s) recordObservation(target, 'burn', resolveResult(s, 'burn') || { token: 'heated', text: 'Heated; no visible change' });
      }
      if (name === 'brushTube') scrubTube();
    },
  },

  burn: {
    title: 'Burn test',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const r = state.burnResults[target];
      return shell(t('Burn test'), 'heat_source', `
        <div class="split">
          <div class="apparatus-wrap">${svg.burnSvg(r)}</div>
          <div class="controls">
            ${targetPicker(target)}
            <div class="btn-row">
              ${btn('burnRun', t('Run the burn test with tweezers in the hood'), 'primary')}
              ${btn('burnBare', t('Hold it in your bare fingers at the bench'))}
            </div>
            ${r ? `<div class="burn-card">
              <p><strong>${t('Speed:')}</strong> ${t(r.speed)}</p>
              <p><strong>${t('Odour:')}</strong> ${t(r.odor)}</p>
              <p><strong>${t('Residue:')}</strong> ${t(r.residue)}</p>
              <p class="proxy">${tb('Odour is shown as a written comparison — a browser cannot deliver smell. Treat it as a reference card, not as a real observation.')}</p>
            </div>` : ''}
          </div>
        </div>`, 'Tweezers, in the hood, with goggles on.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      const s = sampleFor(target);
      if (!s) return;
      if (name === 'burnBare') {
        note(t('Ran a burn test without tweezers or the hood — unsafe and it would cost you at the event'), 'bad');
        return;
      }
      if (name === 'burnRun') {
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
    },
  },

  density: {
    title: 'Density',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const m = state.measurements[target] || {};
      return shell(t('Density by mass and volume'), 'balance', `
        <div class="split">
          <div class="apparatus-wrap">${svg.balanceSvg(m.mass)}
            <p class="apparatus-label">${t('cylinder before')} ${m.v0 ?? '—'} mL · ${t('after')} ${m.v1 ?? '—'} mL</p></div>
          <div class="controls">
            ${targetPicker(target)}
            <label class="field"><span>${t('Mass (g)')}</span><input id="mass" type="number" step="0.01" inputmode="decimal" placeholder="12.40" value="${typed('mass')}"/></label>
            <label class="field"><span>${t('Cylinder before (mL)')}</span><input id="v0" type="number" step="0.1" inputmode="decimal" placeholder="50.0" value="${typed('v0')}"/></label>
            <label class="field"><span>${t('Cylinder after (mL)')}</span><input id="v1" type="number" step="0.1" inputmode="decimal" placeholder="55.6" value="${typed('v1')}"/></label>
            ${btn('calcDensity', t('Calculate density'), 'primary')}
            <p class="readout">${m.density != null ? `${target} · ${t('density {d} g/cm³', { d: m.density.toFixed(2) })}` : t('No density recorded yet')}</p>
            <p class="callout small">${tb('Displacement in a graduated cylinder is the volume. Density identifies glass types and metals when appearance is not enough.')}</p>
          </div>
        </div>`, 'Mass ÷ displaced volume.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      if (name !== 'calcDensity') return;
      const mass = parseFloat(stage.querySelector('#mass')?.value);
      const v0 = parseFloat(stage.querySelector('#v0')?.value);
      const v1 = parseFloat(stage.querySelector('#v1')?.value);
      if ([mass, v0, v1].some(Number.isNaN)) { note(t('Fill in mass and both cylinder readings'), 'bad'); return; }
      const vol = v1 - v0;
      if (vol <= 0) { note(t('Displaced volume must be positive'), 'bad'); return; }
      recordMeasurement(target, 'mass', mass);
      recordMeasurement(target, 'volume', vol);
      recordMeasurement(target, 'density', mass / vol);
      const s = sampleFor(target);
      note(t('{label} density = {d} g/cm³{true}',
        { label: target, d: (mass / vol).toFixed(2), true: s?.density ? ` ${t('(true value {v})', { v: s.density })}` : '' }), 'good');
    },
  },

  magnet: {
    title: 'Magnets',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      return shell(t('Magnets'), 'magnet', `
        <div class="split">
          <div class="apparatus-wrap"><div class="lens-view">${observationText(state.observations[target]?.magnet) || t('No magnet test recorded')}</div></div>
          <div class="controls">
            ${targetPicker(target)}
            <div class="btn-row">
              ${btn('magPaper', t('Draw filings out through paper'), 'primary')}
              ${btn('magDirect', t('Touch the magnet to the sample'))}
            </div>
            <p class="callout small">${tb('Pulling through paper keeps the sample clean and keeps the iron for the next test.')}</p>
          </div>
        </div>`, 'Iron filings are the only thing on this shelf a magnet answers.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      const s = sampleFor(target);
      if (!s) return;
      markTechnique('magnet_through_paper', name === 'magPaper');
      recordObservation(target, 'magnet', resolveResult(s, 'magnet'));
    },
  },

  temperature: {
    title: 'Thermometer',
    view: () => {
      const target = ui.target || unknowns()[0]?.label;
      const m = state.measurements[target] || {};
      return shell(t('Thermometer'), 'thermometer', `
        <div class="split">
          <div class="apparatus-wrap">${svg.thermometerSvg(m.temp)}</div>
          <div class="controls">
            ${targetPicker(target)}
            <div class="btn-row">
              ${btn('tempImmerse', t('Immerse the bulb fully'), 'primary')}
              ${btn('tempPartial', t('Leave the bulb half out of the liquid'))}
              ${btn('tempStir', t('Use the thermometer to stir'))}
            </div>
            <p class="readout">${m.temp != null ? `${target} · ${m.temp} °C` : t('No temperature recorded')}</p>
          </div>
        </div>`, 'A thermometer is not a stirring rod.');
    },
    action(name, data, stage) {
      const target = stage.querySelector('#target')?.value; ui.target = target;
      if (name === 'tempStir') { markTechnique('not_a_stirrer', false); return; }
      if (name === 'tempImmerse') { markTechnique('bulb_immersed', true); markTechnique('not_a_stirrer', true); recordMeasurement(target, 'temp', 78); }
      if (name === 'tempPartial') { markTechnique('bulb_immersed', false); recordMeasurement(target, 'temp', 54); }
    },
  },

  clean: {
    title: 'Cleaning',
    view: () => shell(t('Cleaning and decontamination'), 'paper_towels', `
      <div class="tool-state">
        ${['dropper', 'spatula', 'electrodes'].map(id => `<div class="tool ${state.tools[id].contaminatedWith ? 'dirty' : 'clean'}">
          <strong>${t(id)}</strong> ${state.tools[id].contaminatedWith ? t('carrying residue from {label}', { label: state.tools[id].contaminatedWith }) : t('clean')}
        </div>`).join('')}
        <div class="tool ${state.tools.tube.filledFraction ? 'dirty' : 'clean'}">
          <strong>${t('tube')}</strong> ${state.tools.tube.filledFraction ? t('still holding the last sample') : t('clean')}
        </div>
      </div>
      <div class="btn-row">
        ${btn('rinseDropper', t('Rinse dropper'), 'primary')}
        ${btn('cleanSpatula', t('Clean spatula'), 'primary')}
        ${btn('condRinse', t('Rinse the electrodes'), 'primary')}
        ${btn('brushTube', t('Scrub the tube clean'), 'primary')}
      </div>
      <p class="callout">${tb('Half the wrong answers in this event come from carrying one sample into another. This station is where you undo that.')}</p>`,
      'Between every unknown, every tool.'),
    action(name) {
      if (name === 'rinseDropper') { cleanTool('dropper'); markTechnique('rinsed_between_samples', true); }
      if (name === 'cleanSpatula') { cleanTool('spatula'); markTechnique('cleaned_between_samples', true); }
      if (name === 'condRinse') { cleanTool('electrodes'); markTechnique('rinsed_electrodes', true); }
      if (name === 'brushTube') scrubTube();
    },
  },

  beaker: {
    title: 'Beakers',
    view: () => shell(t('Beakers'), 'beaker', `
      <div class="btn-row">
        ${btn('beakerMeasure', t('Use the beaker to measure 50 mL'))}
        ${btn('beakerRight', t('Use a graduated cylinder to measure, then pour into the beaker'), 'primary')}
      </div>
      <p class="callout">${tb('Beaker graduations are good to roughly 5%. Use one for reactions and chromatogram development, never for a volume you have to report.')}</p>`,
      'Reactions and developing chromatograms, not measuring.'),
    action(name) {
      if (name === 'beakerMeasure') markTechnique('no_beaker_measuring', false);
      if (name === 'beakerRight') markTechnique('no_beaker_measuring', true);
    },
  },

  flask: {
    title: 'Erlenmeyer flasks',
    view: () => shell(t('Erlenmeyer flask'), 'erlenmeyer', `
      <div class="btn-row">
        ${toggle('flaskSwirl', t('Swirl the flask'), ui.flaskMix === 'swirl')}
        ${toggle('flaskStir', t('Stir it with a rod'), ui.flaskMix === 'stir')}
      </div>
      <p class="readout">${t(FLASK_MIX[ui.flaskMix])}</p>
      <p class="callout">${tb('The narrow neck exists so you can mix by swirling without losing sample or letting it spatter.')}</p>`, 'Mix by swirling.'),
    action(name) {
      if (name === 'flaskSwirl') { ui.flaskMix = 'swirl'; markTechnique('swirl_not_stir', true); }
      if (name === 'flaskStir') { ui.flaskMix = 'stir'; markTechnique('swirl_not_stir', false); }
    },
  },

  retrieve: {
    title: 'Tongs, forceps, tweezers',
    view: () => shell(t('Retrieving objects from liquids'), 'tweezers', `
      <div class="btn-row">${btn('retrieveRun', t('Lift the fragment out with tweezers'), 'primary')}</div>
      <p class="readout">${state.retrieved.done ? t('Fragment retrieved and set on the labelled tray') : t('Nothing retrieved yet')}</p>
      <p class="callout">${tb('Retrieved evidence goes on its own labelled surface. Anything dropped back into the liquid is contaminated evidence.')}</p>`, 'Hold and retrieve without touching.'),
    action(name) {
      if (name === 'retrieveRun') { state.retrieved.done = true; note(t('Fragment retrieved and set on the labelled tray'), 'good'); }
    },
  },
};

function wellReadout() {
  const w = state.wells[ui.well];
  if (!w?.result) return '';
  return `<div class="well-readout">
    <strong>${ui.well}${w.label ? ` (${w.label})` : ` — ${t('unlabelled')}`}</strong>
    <span>${w.sample} + ${t(TEST_LABEL[w.reagent])}</span>
    <p>${observationText(w.result)}</p>
    ${w.contaminated ? `<p class="flag">${t('This result is unreliable — the tool carried another sample into the well.')}</p>` : ''}
  </div>`;
}

function measureForm(c) {
  return `<div class="measure-form">
    <label class="field"><span>${t('Solvent front (mm)')}</span><input id="frontMm" type="number" step="1" value="${c.frontMm}"/></label>
    <label class="field"><span>${t('Dye distance (mm)')}</span><input id="dyeMm" type="number" step="1" placeholder="31" value="${typed('dyeMm')}"/></label>
    <label class="field check"><input id="fromBaseline" type="checkbox" ${checked('fromBaseline', true)}/> ${t('Measured from the pencil baseline')}</label>
    ${btn('measureRf', t('Calculate Rf'), 'primary')}
  </div>`;
}

function chromatogramTable() {
  if (!state.chromatograms.length) return '';
  const rows = state.chromatograms.map(c => `<tr>
    <td>${t(c.inkLabel)}</td><td>${t(SOLVENTS[c.solvent].name)}</td><td>${t(c.method)}</td>
    <td>${c.dyes.map(d => `${t(d.name)} ${d.rf.toFixed(2)}`).join(', ')}</td>
    <td>${c.usedPen ? t('pen — ruined') : t('pencil')}</td>
  </tr>`).join('');
  return `<table class="table"><thead><tr><th>${t('Ink')}</th><th>${t('Solvent')}</th><th>${t('Method')}</th><th>${t('Rf values')}</th><th>${t('Baseline')}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

Object.assign(LAB, { ui: ui, unknowns: unknowns, sampleFor: sampleFor, categoryFor: categoryFor, STATIONS: STATIONS });
})(window.LAB);
