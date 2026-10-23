(function (LAB) {
'use strict';

// The case file: every clue the student has, on screen the whole time. The brief and
// scene notes, each suspect's belongings and alibi, and everything the bench has
// found about each piece of evidence. It never hides behind a tab, because the whole
// point of the event is cross-referencing these against each other.

const { state, observationText } = LAB;
const { TESTS, BY_ID, labelFor, INK_BY_ID, SOLVENTS } = LAB;
const { DRILLS } = LAB;
const { ui, inkSource } = LAB;
const { t, tb } = LAB;

const DIFFICULTY_LABEL = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
const TEST_LABEL = Object.fromEntries(TESTS.map(x => [x.id, x.label]));
const MARKS = [
  { id: 'suspect', label: 'Suspect' },
  { id: 'cleared', label: 'Cleared' },
];

function caseSection() {
  if (state.mode === 'drill') {
    const active = state.activeDrill;
    return `<section class="cf-section">
      <h3>${t('Drills')}</h3>
      <p class="hint">${tb('Each drill maps onto one of the four Core Lab Expectations for Division B chemistry.')}</p>
      <div class="drills">${DRILLS.map(d => `<button class="drill ${d.id === active?.id ? 'active' : ''}" data-drill="${d.id}">
        <strong>${t(d.title)}</strong>${d.expectation ? `<span class="tag">${t('expectation {n}', { n: d.expectation })}</span>` : ''}
        <p>${tb(d.goal)}</p></button>`).join('')}</div>
    </section>`;
  }
  if (!state.case) {
    return `<section class="cf-section">
      <h3>${t('Sandbox')}</h3>
      <p class="brief">${tb('Free bench. Every device is unlocked and nothing is scored except technique.')}</p>
    </section>`;
  }
  const c = state.case;
  return `<section class="cf-section">
    <p class="cf-kicker">${t('Case file')} · #${state.seed} · ${t(DIFFICULTY_LABEL[c.difficulty] || 'Normal')}</p>
    <h2 class="cf-title">${c.title}</h2>
    <p class="brief">${c.brief}</p>
    <ul class="clues">${(c.clues || []).map(x => `<li>${x}</li>`).join('')}</ul>
    <p class="hint">${c.hint}</p>
  </section>`;
}

function suspectsSection() {
  const c = state.case;
  if (!c) return '';
  return `<section class="cf-section">
    <h3>${t('Suspects')}</h3>
    <div class="suspects">
      ${c.suspects.map(s => {
        const mark = state.notes.marks[s.id];
        return `<article class="suspect ${mark ? `is-${mark}` : ''}">
          <header>
            <div><strong>${s.name}</strong><span>${s.role}</span></div>
            <div class="mark-row">${MARKS.map(m => `<button class="mark ${mark === m.id ? 'on' : ''}" data-mark="${s.id}" data-value="${m.id}" aria-pressed="${mark === m.id}">${t(m.label)}</button>`).join('')}</div>
          </header>
          <p><span class="alibi ${s.alibiVerified ? 'ok' : 'weak'}">${s.alibiVerified ? t('alibi verified') : t('alibi unverified')}</span> ${s.alibi}.</p>
          <p class="motive">${t('Motive:')} ${s.motive}.</p>
          ${s.items?.length ? `<ul class="items">${s.items.map(it => `<li><span>${it.place}</span><strong>${t(BY_ID[it.sampleId]?.name || it.sampleId)}</strong></li>`).join('')}</ul>` : ''}
          ${s.inkId ? `<p class="owns">${t('Carries:')} ${t(INK_BY_ID[s.inkId].label)}</p>` : ''}
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

function findingRows(label) {
  const obs = state.observations[label] || {};
  const m = state.measurements[label] || {};
  const rows = TESTS.filter(x => obs[x.id]).map(x => {
    const r = obs[x.id];
    return `<li class="${r.valid ? '' : 'bad'}"><span>${t(TEST_LABEL[x.id])}</span>${observationText(r)}${r.valid ? '' : ` <em>${t('— but the result is unreliable')}</em>`}</li>`;
  });
  if (m.mass != null) rows.push(`<li><span>${t('Mass')}</span>${m.mass.toFixed(2)} g</li>`);
  if (m.v1 != null) rows.push(`<li><span>${t('Displacement')}</span>${m.v0} → ${m.v1} mL</li>`);
  if (m.liquidMl) rows.push(`<li><span>${t('Volume weighed')}</span>${m.liquidMl.toFixed(1)} mL</li>`);
  if (m.diaUm != null) rows.push(`<li><span>${t('Reticle')}</span>${t('diameter {d} µm, medulla {w} µm', { d: m.diaUm, w: m.medUm })}</li>`);
  if (m.temp != null) rows.push(`<li><span>${t('Temperature')}</span>${m.temp.toFixed(1)} °C</li>`);
  return rows;
}

function evidenceSection() {
  const list = state.unknowns || [];
  if (!list.length) return '';
  return `<section class="cf-section">
    <h3>${t('Evidence & findings')}</h3>
    <div class="evidence">
      ${list.map(u => {
        const rows = findingRows(u.label);
        return `<article class="ev ${u.label === ui.target ? 'current' : ''}">
          <button class="ev-head" data-unknown="${u.label}" title="${t('Work on this item')}">
            <strong>${u.label}</strong><span>${labelFor(u.category)}</span>
            ${u.label === ui.target ? `<em>${t('on the bench')}</em>` : ''}
          </button>
          ${u.where ? `<p class="where">${u.where}</p>` : ''}
          ${rows.length ? `<ul class="findings">${rows.join('')}</ul>` : `<p class="empty">${t('No tests run yet.')}</p>`}
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

function inkSection() {
  const measured = state.chromatograms.filter(c => c.measured);
  if (!state.case?.chromatography && !measured.length) return '';
  const rows = measured.map(c => `<tr>
    <td>${inkSource(c.sourceId)?.label || c.sourceId}</td><td>${t(SOLVENTS[c.solvent].name)}</td>
    <td>${c.measured.front}</td><td>${c.measured.dyes.join(', ')}</td>
    <td>${c.usedPen ? `<span class="warn">${t('pen')}</span>` : c.measured.fromBaseline ? t('baseline') : `<span class="warn">${t('paper edge')}</span>`}</td>
  </tr>`).join('');
  return `<section class="cf-section">
    <h3>${t('Chromatograms')}</h3>
    ${measured.length
      ? `<table class="table"><thead><tr><th>${t('Ink')}</th><th>${t('Solvent')}</th><th>${t('Front (mm)')}</th><th>${t('Spots (mm)')}</th><th>${t('From')}</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<p class="empty">${t('Develop a strip, then measure it with the ruler.')}</p>`}
  </section>`;
}

function notesSection() {
  return `<section class="cf-section">
    <h3>${t('Your notes')}</h3>
    <textarea id="caseNotes" rows="4" placeholder="${t('Working notes, calculations, hunches…')}">${(state.notes.text || '').replace(/</g, '&lt;')}</textarea>
  </section>`;
}

// The full bench log, newest first. Every line is listed: this list is the record a
// student gets scored on, so a truncated one hides evidence they still need.
function logSection() {
  const entries = state.log;
  return `<section class="cf-section">
    <h3>${t('Bench log')} <span class="count">${entries.length}</span></h3>
    ${entries.length
      ? `<ul class="benchlog">${entries.map(l => `<li class="${l.kind}">${l.text}</li>`).join('')}</ul>`
      : `<p class="empty">${t('Nothing recorded yet.')}</p>`}
    ${entries.some(l => l.kind === 'key') ? `<p class="hint"><span class="key-swatch">■</span> ${t('Key result: tells this evidence apart from a look-alike')}</p>` : ''}
  </section>`;
}

function renderCaseFile(root) {
  // The notepad keeps its caret: if it is being typed in, leave it alone.
  const typing = document.activeElement?.id === 'caseNotes';
  const scroll = root.scrollTop;
  if (typing) {
    const keep = root.querySelector('#caseNotes').closest('.cf-section');
    root.querySelectorAll('.cf-section').forEach(el => { if (el !== keep) el.remove(); });
    keep.insertAdjacentHTML('beforebegin', caseSection() + suspectsSection() + evidenceSection() + inkSection() + logSection());
    return;
  }
  root.innerHTML = caseSection() + suspectsSection() + evidenceSection() + inkSection() + logSection() + notesSection();
  root.scrollTop = scroll;
}

Object.assign(LAB, { renderCaseFile: renderCaseFile });
})(window.LAB);
