(function (LAB) {
'use strict';

const { DEVICES, EVENT_PROVIDED, GROUPS } = LAB;
const { state } = LAB;
const { svg } = LAB;
const { ui } = LAB;
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
  if (id === 'kit_box') {
    const on = Object.values(state.ppe).filter(Boolean).length;
    return { kind: on ? 'ok' : 'warn', text: `${on}/${Object.keys(state.ppe).length}` };
  }
  return null;
}

function renderShelf(root) {
  const all = [...DEVICES, ...EVENT_PROVIDED];
  root.innerHTML = `<h2 class="shelf-title">${t('Equipment')}</h2><div class="shelf-groups">` + GROUPS.map(group => {
    const items = all.filter(d => d.group === group);
    if (!items.length) return '';
    // A device with withDevice is listed under another one instead of getting its own
    // entry, so one bench operation is one click.
    const entries = items.filter(d => !d.withDevice);
    return `<div class="shelf-group">
      <h3>${t(group)}${group === 'Provided' ? ` <span class="tag">${t('check rules')}</span>` : ''}</h3>
      <div class="device-grid">
      ${entries.map(d => {
        const merged = items.filter(o => o.withDevice === d.id);
        const b = badge(d.id);
        return `<button class="device ${d.id === ui.device ? 'active' : ''}" data-device="${d.id}" title="${[d, ...merged].map(o => t(o.use)).join(' · ')}">
        <span class="device-icon">${svg.icon(d.icon)}</span>
        <span class="device-name">${t(d.shelfName || d.name)}</span>
        ${b ? `<span class="badge ${b.kind}">${b.text}</span>` : ''}
      </button>`;
      }).join('')}
      </div>
    </div>`;
  }).join('') + '</div>';
}

Object.assign(LAB, { renderShelf: renderShelf });
})(window.LAB);
