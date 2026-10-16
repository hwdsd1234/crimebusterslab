(function (LAB) {
'use strict';

const { DEVICES, EVENT_PROVIDED, GROUPS } = LAB;
const { svg } = LAB;
const { ui } = LAB;
const { t } = LAB;

function renderShelf(root) {
  const all = [...DEVICES, ...EVENT_PROVIDED];
  root.innerHTML = GROUPS.map(group => {
    const items = all.filter(d => d.group === group);
    if (!items.length) return '';
    // A device with withDevice is listed under another one instead of getting its own
    // entry, so one bench operation is one click.
    const entries = items.filter(d => !d.withDevice);
    return `<div class="shelf-group">
      <h3>${t(group)}${group === 'Provided' ? ` <span class="tag">${t('check rules')}</span>` : ''}</h3>
      ${entries.map(d => {
        const merged = items.filter(o => o.withDevice === d.id);
        return `<button class="device ${d.id === ui.device ? 'active' : ''}" data-device="${d.id}" title="${[d, ...merged].map(o => t(o.use)).join(' · ')}">
        <span class="device-icon">${svg.icon(d.icon)}</span>
        <span class="device-name">${t(d.shelfName || d.name)}</span>
      </button>`;
      }).join('')}
    </div>`;
  }).join('');
}

Object.assign(LAB, { renderShelf: renderShelf });
})(window.LAB);
