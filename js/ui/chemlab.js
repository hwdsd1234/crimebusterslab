(function (LAB) {
'use strict';

// The chem lab: a free bench with every chemical in the kit and four beakers. Put
// anything in any beaker, pour beakers together, and run any test on what is in
// them. What happens comes from the same sample data the cases use, so a reaction
// seen here is the reaction a case will show.

const { state, note } = LAB;
const { ALL_SAMPLES, resolveResult, CATEGORY_LABELS } = LAB;
const { t, tVars } = LAB;
const svg = LAB.svg;

// Two lab reagents that are not evidence samples but belong on the chemical shelf.
const EXTRA = [
  {
    id: 'iodine_solution', name: 'Iodine Solution', formula: 'I₂ / KI', category: 'reagent', liquid: true,
    appearance: 'Clear amber-brown liquid', density: 1.01, ph: 5.5, conductivity: 'weak',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: { appearance: ['amber liquid', 'Clear amber-brown liquid'], burn: ['no burn', 'Does not burn'] },
  },
  {
    id: 'acetone', name: 'Acetone', formula: 'C₃H₆O', category: 'reagent', liquid: true,
    appearance: 'Colourless liquid with a sharp sweet smell', density: 0.79, ph: 7.0, conductivity: 'none',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: { appearance: ['colourless liquid', 'Colourless liquid with a sharp sweet smell'], burn: ['flammable', 'Catches fire instantly with a clean flame'] },
  },
];

const CHEMS = [...ALL_SAMPLES, ...EXTRA];
const CHEM_BY_ID = Object.fromEntries(CHEMS.map(c => [c.id, c]));
const SHELF_ORDER = ['clear_liquid', 'reagent', 'white_powder', 'tablet', 'metal', 'soil', 'fiber', 'hair', 'glass', 'plastic'];
const CATEGORY_NAME = { ...CATEGORY_LABELS, reagent: 'lab reagent' };

// A chemical that acts as a test reagent when mixed: mixing it with X shows X's
// result for that test.
const ROLE = {
  water: 'water', vinegar: 'vinegar', iodine_solution: 'iodine', baking_soda: 'bicarb',
  hydrogen_peroxide: 'h2o2', rubbing_alcohol: 'ethanol', acetone: 'acetone',
};

// Mixtures that make a dangerous gas. The lab shows them, loudly, so they are learnt
// here and never tried for real.
const DANGER = [
  { a: 'bleach', b: 'ammonia', text: 'DANGER: toxic chloramine gas! Never mix bleach and ammonia.' },
  { a: 'bleach', b: 'rubbing_alcohol', text: 'DANGER: forms chloroform and toxic fumes! Never mix bleach and alcohol.' },
  { a: 'bleach', b: 'acetone', text: 'DANGER: forms chloroform and toxic fumes! Never mix bleach and acetone.' },
];
const BLEACH_ACID = 'DANGER: toxic chlorine gas! Never mix bleach with an acid.';

const BEAKERS = 4;
const QUIET = new Set(['negative', 'no change', 'miscible', 'no burn']);

function freshChem() {
  return { selected: 'water', beakers: Array.from({ length: BEAKERS }, () => ({ contents: [], events: [] })) };
}

const chemUi = { query: '' };

function chem() { return state.chem ||= freshChem(); }
function isLiquid(c) { return c.liquid || c.category === 'clear_liquid'; }
function isAcid(c) { return c.results?.bicarb?.[0] === 'effervesce' || (c.ph != null && c.ph < 4.5); }
function isCarbonate(c) { return c.results?.vinegar?.[0] === 'effervesce'; }
function name(c) { return t(c.name); }

function textOf(r) { return r.vars ? tVars(r.key || r.text, r.vars) : t(r.key || r.text); }
function asEvent(r, extra = {}) { return { key: r.key || r.text, vars: r.vars || null, token: r.token, ...extra }; }

// What you see when chemical a meets chemical b.
function react(a, b) {
  for (const d of DANGER) {
    if ((a.id === d.a && b.id === d.b) || (a.id === d.b && b.id === d.a)) return { key: d.text, tag: 'danger' };
  }
  if ((a.id === 'bleach' && isAcid(b)) || (b.id === 'bleach' && isAcid(a))) return { key: BLEACH_ACID, tag: 'danger' };

  // Oil and a water-based liquid never mix, whatever else either one is.
  const la = isLiquid(a), lb = isLiquid(b);
  if (la && lb) {
    const oil = [a, b].find(c => c.solubility?.water === 'insoluble');
    if (oil) return { key: 'Does not mix — two layers form, with {oil} floating on top', vars: { oil: oil.name }, tag: 'layers' };
  }

  // One of them is a test reagent: show the other's result for that test. A reagent
  // that does something to the other wins over one that does nothing.
  const tries = [];
  if (ROLE[a.id]) tries.push(resolveResult(b, ROLE[a.id]));
  if (ROLE[b.id]) tries.push(resolveResult(a, ROLE[b.id]));
  const found = tries.filter(Boolean);
  const loud = found.find(r => !QUIET.has(r.token));
  if (loud) return asEvent(loud, { tag: tagFor(loud.token) });

  // Acid meets carbonate (or a reactive metal) without vinegar in the mix.
  if (isAcid(a) && isCarbonate(b)) return asEvent(resolveResult(b, 'vinegar'), { tag: 'fizz' });
  if (isAcid(b) && isCarbonate(a)) return asEvent(resolveResult(a, 'vinegar'), { tag: 'fizz' });
  if (found.length) return asEvent(found[0], { tag: tagFor(found[0].token) });

  // Plain dissolving or mixing.
  if (la && lb) return { key: 'Mixes in all proportions, no separation' };
  if (la || lb) {
    const solid = la ? b : a;
    const r = resolveResult(solid, 'water');
    if (r) return asEvent(r, { tag: tagFor(r.token) });
  }
  return { key: 'The two solids just sit together — nothing happens until a liquid is added' };
}

function tagFor(token) {
  if (['effervesce', 'reacts'].includes(token)) return 'fizz';
  if (token === 'starch positive') return 'starch';
  if (token === 'bleaches') return 'bleached';
  if (['precipitate', 'partial'].includes(token)) return 'cloudy';
  return null;
}

function kindFor(tag) {
  if (tag === 'danger') return 'bad';
  if (tag && tag !== 'cloudy') return 'key';
  return 'info';
}

function addChemical(i, id) {
  const b = chem().beakers[i];
  const c = CHEM_BY_ID[id];
  if (!b || !c) return;
  if (b.contents.includes(id)) {
    note(t('Beaker {n}: added more {name}', { n: i + 1, name: name(c) }), 'info');
    return;
  }
  const others = b.contents.map(x => CHEM_BY_ID[x]);
  b.contents.push(id);
  if (!others.length) {
    record(i, { key: 'Added {name}', vars: { name: c.name } }, 'info');
    return;
  }
  for (const o of others) {
    const r = react(c, o);
    record(i, { ...r, pair: [c.name, o.name] }, kindFor(r.tag));
  }
}

function pour(from, to) {
  const src = chem().beakers[from];
  if (!src?.contents.length || from === to) return;
  note(t('Poured beaker {a} into beaker {b}', { a: from + 1, b: to + 1 }), 'info');
  for (const id of src.contents) addChemical(to, id);
  src.contents = [];
  src.events = [];
}

function empty(i) {
  const b = chem().beakers[i];
  b.contents = [];
  b.events = [];
  note(t('Beaker {n} emptied and washed', { n: i + 1 }), 'info');
}

function record(i, ev, kind) {
  const b = chem().beakers[i];
  b.events.unshift({ ...ev, kind });
  if (b.events.length > 30) b.events.pop();
  const what = ev.pair ? `${t(ev.pair[0])} + ${t(ev.pair[1])}: ` : '';
  note(`${t('Beaker {n}', { n: i + 1 })} · ${what}${eventText(ev)}`, kind);
}

function eventText(ev) {
  return ev.vars ? tVars(ev.key, ev.vars) : t(ev.key);
}

// ───────────────────────── tests on a beaker ─────────────────────────

// Mixed solutions: average the excess acid or base, so an acid poured into a base
// moves the pH toward neutral the way it does on the bench.
function mixturePh(list) {
  const xs = list.filter(c => c.ph != null);
  if (!xs.length) return null;
  const net = xs.reduce((s, c) => s + Math.pow(10, -c.ph) - Math.pow(10, c.ph - 14), 0) / xs.length;
  if (Math.abs(net) < 1e-7) return 7;
  const ph = net > 0 ? -Math.log10(net) : 14 + Math.log10(-net);
  return Math.round(Math.min(14, Math.max(0, ph)) * 10) / 10;
}

const LEVEL = { none: 0, weak: 1, strong: 2 };

const TESTS = [
  { id: 'look', label: 'Look closely', icon: 'lens' },
  { id: 'ph', label: 'pH paper', icon: 'phpaper' },
  { id: 'conductivity', label: 'Conductivity', icon: 'conductivity' },
  { id: 'heat', label: 'Heat / burn', icon: 'flame' },
  { id: 'magnet', label: 'Magnet', icon: 'magnet' },
  { id: 'micro', label: 'Microscope', icon: 'microscope' },
  { id: 'density', label: 'Density', icon: 'balance' },
];

function runTest(i, testId) {
  const list = chem().beakers[i].contents.map(id => CHEM_BY_ID[id]);
  if (!list.length) { note(t('Beaker {n} is empty — add a chemical first', { n: i + 1 }), 'bad'); return; }

  if (testId === 'ph') {
    const ph = mixturePh(list);
    if (ph == null) return record(i, { key: 'The pH paper does not change — nothing here dissolves to give a pH' }, 'info');
    const r = resolveResult({ ph }, 'ph');
    return record(i, { key: r.key, vars: r.vars, tag: ph < 4 || ph > 10 ? 'strong' : null }, ph < 4 || ph > 10 ? 'key' : 'info');
  }
  if (testId === 'conductivity') {
    if (list.some(c => c.category === 'metal')) return record(i, { key: 'Full deflection — the metal itself conducts electricity' }, 'key');
    if (!list.some(isLiquid)) return record(i, { key: 'No deflection — dry solids do not conduct. Add water first.' }, 'info');
    const dissolved = list.filter(c => isLiquid(c) || ['soluble', 'partial', 'reacts'].includes(c.solubility?.water));
    const level = dissolved.reduce((m, c) => Math.max(m, LEVEL[c.conductivity] ?? 0), 0);
    const r = resolveResult({ conductivity: Object.keys(LEVEL)[level] }, 'conductivity');
    return record(i, { key: r.text }, level === 2 ? 'key' : 'info');
  }
  for (const c of list) {
    let r = null;
    if (testId === 'look') r = resolveResult(c, 'appearance');
    if (testId === 'heat') r = resolveResult(c, 'burn') || { text: 'Chars and smokes; no clear flame' };
    if (testId === 'magnet') r = resolveResult(c, 'magnet');
    if (testId === 'micro') r = resolveResult(c, 'micro') || { text: 'Nothing useful to see at 40×' };
    if (testId === 'density') r = resolveResult(c, 'density') || { text: 'No density to measure' };
    if (!r) continue;
    const loud = testId === 'heat' ? !QUIET.has(r.token) : testId === 'magnet' ? r.token === 'magnetic' : false;
    record(i, { key: r.key || r.text, vars: r.vars || null, of: c.name }, loud ? 'key' : 'info');
  }
}

// ───────────────────────── drawing ─────────────────────────

function beakerColor(b) {
  const tags = new Set(b.events.map(e => e.tag));
  const has = id => b.contents.includes(id);
  if (tags.has('starch')) return '#1d2340';
  if (has('iodine_solution') && !tags.has('bleached')) return '#c08a1e';
  if (has('milk')) return '#f3efe6';
  if (has('bleach')) return '#eef3c8';
  return '#cfe6f5';
}

function beakerSvg(b) {
  const list = b.contents.map(id => CHEM_BY_ID[id]);
  const tags = new Set(b.events.map(e => e.tag));
  const liquid = list.some(isLiquid);
  const solids = list.filter(c => !isLiquid(c));
  const color = beakerColor(b);
  const top = liquid ? 70 : 150;
  const bubbles = tags.has('fizz')
    ? [[70, 120], [90, 100], [110, 130], [80, 90], [125, 110], [100, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#fff" stroke-width="1.5"/>`).join('')
    : '';
  const solidMarks = solids.map((c, k) => {
    const x = 58 + k * 22;
    if (c.category === 'metal') return `<rect x="${x}" y="156" width="20" height="8" rx="2" fill="#9aa1ab" stroke="#4a4f59"/>`;
    if (c.category === 'fiber' || c.category === 'hair') return `<path d="M${x} 160q6-10 12 0t12 0" fill="none" stroke="#6b5d4f" stroke-width="2"/>`;
    const dissolved = liquid && c.solubility?.water === 'soluble';
    return dissolved ? '' : `<ellipse cx="${x + 10}" cy="162" rx="11" ry="4" fill="#f4f4f0" stroke="#a9a9a2"/>`;
  }).join('');
  const layer = tags.has('layers') ? `<rect x="41" y="${top}" width="118" height="16" fill="#f1d36b" opacity=".85"/>` : '';
  const gas = tags.has('danger') ? '<path d="M60 40q10-18 25-6q12-16 28 0q14-12 24 6" fill="#e5484d" opacity=".35"/><text x="100" y="22" text-anchor="middle" font-size="16" font-weight="700" fill="#e5484d">⚠</text>' : '';
  return `<svg viewBox="0 0 200 190" class="chem-beaker" aria-hidden="true">
    ${gas}
    <path d="M40 40v124a8 8 0 0 0 8 8h104a8 8 0 0 0 8-8V40" fill="#f7fafc" stroke="#5b6b7c" stroke-width="2"/>
    ${liquid ? `<rect x="41" y="${top}" width="118" height="${171 - top}" fill="${color}" opacity="${tags.has('cloudy') ? 0.95 : 0.8}"/>` : ''}
    ${layer}${solidMarks}${bubbles}
    ${[70, 100, 130].map(y => `<line x1="40" y1="${y}" x2="52" y2="${y}" stroke="#5b6b7c"/>`).join('')}
  </svg>`;
}

// ───────────────────────── views ─────────────────────────

function renderChemShelf(root) {
  const c = chem();
  const q = chemUi.query.toLowerCase();
  const groups = SHELF_ORDER.map(cat => {
    const items = CHEMS.filter(x => x.category === cat);
    const shown = items.some(x => !q || `${x.name} ${t(x.name)} ${x.formula || ''}`.toLowerCase().includes(q));
    return `<div class="shelf-group" ${shown ? '' : 'hidden'}>
      <h3>${t(CATEGORY_NAME[cat] || cat)}</h3>
      <div class="chem-list">${items.map(x => {
        const hay = `${x.name} ${t(x.name)} ${x.formula || ''}`.toLowerCase();
        return `<button class="chem-pick ${x.id === c.selected ? 'active' : ''}" data-chem-pick="${x.id}" data-hay="${hay.replace(/"/g, '')}" ${q && !hay.includes(q) ? 'hidden' : ''}>
          <span>${t(x.name)}</span>${x.formula ? `<small>${x.formula}</small>` : ''}</button>`;
      }).join('')}</div>
    </div>`;
  }).join('');
  root.innerHTML = `<h2 class="shelf-title">${t('Chemicals')}</h2>
    <p class="shelf-hint">${t('Pick a chemical, then add it to a beaker.')}</p>
    <input class="chem-search" id="chemSearch" type="search" placeholder="${t('Search chemicals…')}" value="${chemUi.query.replace(/"/g, '')}">
    <div class="shelf-groups">${groups}</div>`;
}

function filterChemShelf(root, query) {
  chemUi.query = query;
  const q = query.toLowerCase();
  root.querySelectorAll('[data-chem-pick]').forEach(el => { el.hidden = !!q && !el.dataset.hay.includes(q); });
  root.querySelectorAll('.shelf-group').forEach(g => { g.hidden = !g.querySelector('[data-chem-pick]:not([hidden])'); });
}

function beakerCard(b, i) {
  const c = chem();
  const sel = CHEM_BY_ID[c.selected];
  const others = Array.from({ length: BEAKERS }, (_, k) => k).filter(k => k !== i);
  return `<article class="chem-card ${b.events.some(e => e.tag === 'danger') ? 'danger' : ''}">
    <header><strong>${t('Beaker {n}', { n: i + 1 })}</strong>
      ${b.contents.length ? `<button class="link-btn" data-chem-empty="${i}">${t('Empty & wash')}</button>` : ''}</header>
    <div class="chem-card-body">
      ${beakerSvg(b)}
      <div class="chem-contents">
        ${b.contents.length ? b.contents.map(id => `<span class="chem-chip">${t(CHEM_BY_ID[id].name)}</span>`).join('') : `<p class="empty">${t('Empty')}</p>`}
      </div>
    </div>
    <button class="btn primary small chem-add" data-chem-add="${i}">${t('Add {name}', { name: t(sel.name) })}</button>
    <div class="chem-tests">
      ${TESTS.map(x => `<button class="chem-test" data-chem-test="${x.id}" data-beaker="${i}" ${b.contents.length ? '' : 'disabled'} title="${t(x.label)}">
        ${svg.icon(x.icon)}<span>${t(x.label)}</span></button>`).join('')}
    </div>
    ${b.contents.length ? `<div class="chem-pour">
      <span>${t('Pour into')}</span>
      ${others.map(k => `<button class="chip" data-chem-pour="${i}" data-to="${k}">${t('Beaker {n}', { n: k + 1 })}</button>`).join('')}
    </div>` : ''}
    ${b.events.length ? `<ul class="chem-events">${b.events.slice(0, 6).map(e => `<li class="${e.kind}">
      ${e.pair ? `<em>${t(e.pair[0])} + ${t(e.pair[1])}</em> ` : e.of ? `<em>${t(e.of)}</em> ` : ''}${eventText(e)}</li>`).join('')}</ul>` : ''}
  </article>`;
}

function renderChemBench(root) {
  const c = chem();
  root.innerHTML = `<div class="station">
    <header class="station-head">
      <div><h2>${t('Chem Lab')}</h2>
      <p class="station-use">${t('Mix anything with anything and test it. Nothing here is scored.')}</p></div>
      <p class="station-hint">${t('Selected: {name}', { name: t(CHEM_BY_ID[c.selected].name) })}</p>
    </header>
    <div class="chem-grid">${c.beakers.map(beakerCard).join('')}</div>
  </div>`;
}

function infoRows(x) {
  const sol = x.solubility || {};
  const rows = [
    [t('Formula'), x.formula],
    [t('Kind'), t(CATEGORY_NAME[x.category] || x.category)],
    [t('Appearance'), x.appearance ? t(resolveResult(x, 'appearance')?.text || x.appearance) : null],
    [t('pH'), x.ph != null ? textOf(resolveResult(x, 'ph')) : null],
    [t('Density'), x.density != null ? `${x.density} g/cm³` : null],
    [t('Conductivity'), x.conductivity ? textOf(resolveResult(x, 'conductivity')) : null],
    [t('In water'), sol.water ? t(sol.water) : null],
    [t('In alcohol'), sol.ethanol ? t(sol.ethanol) : null],
    [t('In acetone'), sol.acetone ? t(sol.acetone) : null],
    [t('Magnetic'), x.magnetic ? t('yes') : null],
  ];
  return rows.filter(r => r[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

function renderChemSide(root) {
  const x = CHEM_BY_ID[chem().selected];
  const entries = state.log;
  root.innerHTML = `<section class="cf-section">
      <p class="cf-kicker">${t('Chemical')}</p>
      <h2 class="cf-title">${t(x.name)}</h2>
      <dl class="readouts chem-info">${infoRows(x)}</dl>
    </section>
    <section class="cf-section">
      <h3>${t('Safety')}</h3>
      <p class="hint">${t('Some mixtures here make toxic gas. They are shown in red so you learn them here, never at a real bench.')}</p>
    </section>
    <section class="cf-section">
      <h3>${t('Bench log')} <span class="count">${entries.length}</span></h3>
      ${entries.length
        ? `<ul class="benchlog">${entries.map(l => `<li class="${l.kind}">${l.text}</li>`).join('')}</ul>`
        : `<p class="empty">${t('Nothing recorded yet.')}</p>`}
    </section>`;
}

// One click handler for the chem lab's own controls. Returns true when it handled
// the click, so the caller can redraw.
function handleChemClick(e) {
  const c = chem();
  const pick = e.target.closest('[data-chem-pick]');
  if (pick) { c.selected = pick.dataset.chemPick; return true; }
  const add = e.target.closest('[data-chem-add]');
  if (add) { addChemical(+add.dataset.chemAdd, c.selected); return true; }
  const test = e.target.closest('[data-chem-test]');
  if (test) { runTest(+test.dataset.beaker, test.dataset.chemTest); return true; }
  const p = e.target.closest('[data-chem-pour]');
  if (p) { pour(+p.dataset.chemPour, +p.dataset.to); return true; }
  const em = e.target.closest('[data-chem-empty]');
  if (em) { empty(+em.dataset.chemEmpty); return true; }
  return false;
}

Object.assign(LAB, {
  CHEMS: CHEMS, CHEM_BY_ID: CHEM_BY_ID, freshChem: freshChem, react: react, mixturePh: mixturePh,
  addChemical: addChemical, runTest: runTest, pour: pour,
  renderChemShelf: renderChemShelf, renderChemBench: renderChemBench, renderChemSide: renderChemSide,
  filterChemShelf: filterChemShelf, handleChemClick: handleChemClick,
});
})(window.LAB);
