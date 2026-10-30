(function (LAB) {
'use strict';

const { DEVICES, EVENT_PROVIDED, HELPERS, GROUPS } = LAB;
const { state } = LAB;
const { svg } = LAB;
const { ui, QUICK_TESTS } = LAB;
const { t } = LAB;

// A small badge on a tool tile for state the student should notice without opening
// it: a tool carrying residue, a tube still full, a slide on the stage.
function badge(id) {
  const tools = state.tools;
  if (id === 'dropper' && tools.dropper.contaminatedWith) return { kind: 'dirty', text: tools.dropper.contaminatedWith };
  if (id === 'spatula' && tools.spatula.contaminatedWith) return { kind: 'dirty', text: tools.spatula.contaminatedWith };
  if (id === 'conductivity' && tools.electrodes.contaminatedWith) return { kind: 'dirty', text: tools.electrodes.contaminatedWith };
  if (id === 'test_tube' && tools.tube.contents) return { kind: 'busy', text: tools.tube.contents };
  if (id === 'slide' && state.microscope) return { kind: 'busy', text: state.microscope.label };
  if (id === 'balance' && tools.balance.tared) return { kind: 'ok', text: '0.00' };
  if (id === 'pencil' && state.chromaPrep.baseline === 'pencil') return { kind: 'ok', text: '✓' };
  if (id === 'id_sheet') {
    const right = Object.values(state.guesses).filter(g => g.correct).length;
    return { kind: right ? 'ok' : 'warn', text: `${right}/${(state.unknowns || []).length}` };
  }
  if (id === 'kit_box') {
    const on = Object.values(state.ppe).filter(Boolean).length;
    return { kind: on ? 'ok' : 'warn', text: `${on}/${Object.keys(state.ppe).length}` };
  }
  return null;
}

// The tests themselves, most common first. Clicking one opens the tool that runs it,
// already set up, so a student does not need to know which glassware a test uses.
function testsGroup() {
  return `<h2 class="shelf-title">${t('Tests')}</h2>
  <p class="shelf-hint">${t('Most common first')}</p>
  <div class="test-grid">${QUICK_TESTS.map((q, i) => {
    const runs = q.id === 'ink' ? state.chromatograms.length
      : q.id === 'density' ? Object.values(state.measurements).filter(m => m.mass != null).length
      : Object.values(state.observations).filter(o => o[q.id]).length;
    return `<button class="quick-test ${i < 3 ? 'top' : ''}" data-test="${q.id}">
      <span class="device-icon">${svg.icon(q.icon)}</span><span>${t(q.label)}</span>
      ${runs ? `<span class="badge ok">${runs}</span>` : ''}
    </button>`;
  }).join('')}</div>`;
}

// One labelled group of equipment tiles.
function groupHtml(group, all) {
  const items = group.ids.map(id => all.find(d => d.id === id)).filter(Boolean);
  if (!items.length) return '';
  // A device with withDevice is listed under another one instead of getting its own
  // entry, so one bench operation is one click.
  const entries = items.filter(d => !d.withDevice);
  const merged = id => all.filter(o => o.withDevice === id);
  return `<div class="shelf-group">
    <h3>${t(group.name)}</h3>
    ${group.hint ? `<p class="shelf-hint">${t(group.hint)}</p>` : ''}
    <div class="device-grid">
    ${entries.map(d => {
      const b = badge(d.id);
      return `<button class="device ${d.id === ui.device ? 'active' : ''}" data-device="${d.id}" title="${[d, ...merged(d.id)].map(o => t(o.use)).join(' · ')}${d.provided ? ` (${t('Provided')} · ${t('check rules')})` : ''}">
      <span class="device-icon">${svg.icon(d.icon)}</span>
      <span class="device-name">${t(d.shelfName || d.name)}${d.provided ? ` <span class="provided-mark" title="${t('Provided')}">★</span>` : ''}</span>
      ${b ? `<span class="badge ${b.kind}">${b.text}</span>` : ''}
    </button>`;
    }).join('')}
    </div>
  </div>`;
}

// Top to bottom: PPE first (it has to go on before any test counts), then the
// sandbox ID sheet, then the tests most common first, then the rest of the equipment.
function renderShelf(root) {
  const all = [...DEVICES, ...EVENT_PROVIDED, ...HELPERS];
  const safety = GROUPS.find(g => g.ids.includes('kit_box'));
  const first = [safety];
  if (state.mode === 'sandbox') first.push({ name: 'Practice', hint: 'Guess what each unknown is', ids: ['id_sheet'] });
  const rest = GROUPS.filter(g => g !== safety);
  root.innerHTML = `<div class="shelf-groups">${first.map(g => groupHtml(g, all)).join('')}</div>`
    + testsGroup()
    + `<h2 class="shelf-title">${t('Equipment')}</h2><div class="shelf-groups">${rest.map(g => groupHtml(g, all)).join('')}</div>`;
}

Object.assign(LAB, { renderShelf: renderShelf });
})(window.LAB);
