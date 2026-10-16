(function (LAB) {
'use strict';

const { state, observationText } = LAB;
const { TESTS, labelFor } = LAB;
const { TECHNIQUE_FAILURES, CHECK_LABELS } = LAB;
const { grade, skillHeatmap } = LAB;
const { DRILLS } = LAB;
const { t, tb } = LAB;

const TEST_LABEL = Object.fromEntries(TESTS.map(x => [x.id, x.label]));
// A scorecard verdict is UI vocabulary, but 'partial' is also a solubility token in the
// sample data — sharing one key gives the scorecard the chemistry wording.
const STATUS_LABEL = { unanswered: 'unanswered', correct: 'correct', close: 'close', partial: 'partially correct', wrong: 'wrong' };

function renderUnknowns(root) {
  if (!state.unknowns?.length) { root.innerHTML = ''; return; }
  root.innerHTML = `<h3>${t('Evidence tray')}</h3>
    <div class="unknowns">
      ${state.unknowns.map(u => {
        const runs = Object.keys(state.observations[u.label] || {}).length;
        return `<button class="unknown ${runs ? 'tested' : ''}" data-unknown="${u.label}">
        <strong>${u.label}</strong><span>${labelFor(u.category)}</span>
        <em>${t('{n} tests run', { n: runs })}</em>
      </button>`;
      }).join('')}
    </div>`;
}

function renderLogbook(root) {
  const labels = state.unknowns?.map(u => u.label) || Object.keys(state.observations);
  const usedTests = TESTS.filter(x => labels.some(l => state.observations[l]?.[x.id]));
  if (!usedTests.length) { root.innerHTML = `<h3>${t('Evidence log')}</h3><p class="empty">${t('No tests recorded yet.')}</p>`; return; }

  const head = `<tr><th></th>${usedTests.map(x => `<th>${t(x.short)}</th>`).join('')}</tr>`;
  const body = labels.filter(l => state.observations[l]).map(l => `<tr>
    <th>${l}</th>
    ${usedTests.map(x => {
      const r = state.observations[l]?.[x.id];
      if (!r) return '<td class="blank"></td>';
      const text = observationText(r) + (r.valid ? '' : ` ${t('— but the result is unreliable')}`);
      return `<td class="${r.valid ? 'ok' : 'bad'}" title="${text}">${r.valid ? t(r.token) : '✗ ' + t(r.token)}</td>`;
    }).join('')}
  </tr>`).join('');

  root.innerHTML = `<h3>${t('Evidence log')}</h3>
    <table class="table log"><thead>${head}</thead><tbody>${body}</tbody></table>
    <p class="hint">${tb('A crossed-out result came from a contaminated tool. It is evidence you cannot use.')}</p>`;
}

function renderQuestions(root) {
  const { rows } = grade();

  if (!state.case) {
    root.innerHTML = `<h3>${t('Test')}</h3>
      <p class="empty">${tb('Start a case to get a scored test. Technique and safety points still count here.')}</p>
      ${scorecard(rows)}`;
    return;
  }

  root.innerHTML = `<h3>${t('Test')}</h3>
    <div class="questions">
      ${state.case.questions.map(q => `<div class="question">
        <p class="q-prompt">${q.prompt} <span class="q-pts">${t('{n} pts', { n: q.points })}</span></p>
        ${controlFor(q)}
      </div>`).join('')}
    </div>
    ${scorecard(rows)}`;
}

function scorecard(rows) {
  return `<div class="scorecard">
    <h4>${t('Score')}</h4>
    <table class="table"><thead><tr><th>${t('Section')}</th><th>${t('Points')}</th><th>${t('Result')}</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${r.label}</td><td>${r.earned}/${r.possible}</td><td>${r.status ? t(STATUS_LABEL[r.status]) : ''}</td></tr>`).join('')}</tbody></table>
    <p class="total">${rows.reduce((s, r) => s + r.earned, 0)} / ${rows.reduce((s, r) => s + r.possible, 0)}</p>
  </div>`;
}

function controlFor(q) {
  const given = state.answers[q.id];

  if (q.kind === 'measurement') {
    return `<label class="field inline"><span>${t('Answer')}</span>
      <input class="answer" type="number" step="0.01" inputmode="decimal" data-question="${q.id}" value="${given ?? ''}"/></label>`;
  }

  if (q.kind === 'evidence') {
    const chosen = new Set(given || []);
    return `<div class="choices">${q.options.map(o => `<label class="choice">
      <input class="answer" type="checkbox" data-question="${q.id}" value="${o.value}" ${chosen.has(o.value) ? 'checked' : ''}/> ${o.label}
    </label>`).join('')}</div>`;
  }

  return `<select class="answer" data-question="${q.id}">
    <option value="">${t('— choose —')}</option>
    ${q.options.map(o => `<option value="${o.value}" ${o.value === given ? 'selected' : ''}>${o.label}</option>`).join('')}
  </select>`;
}

// The brief is rebuilt on every action, so the drill menu has to live here: main.js
// used to render it once, and the first bench action replaced it with the sandbox panel.
function renderCaseBrief(root) {
  if (state.mode === 'drill') {
    const active = state.activeDrill;
    root.innerHTML = `<h3>${t('Drills')}</h3>
      <p class="hint">${tb('Each drill maps onto one of the four Core Lab Expectations for Division B chemistry.')}</p>
      ${active ? `<p class="brief">${t(active.title)} — ${tb(active.goal)}</p>` : ''}
      <div class="drills">${DRILLS.map(d => `<button class="drill ${d.id === active?.id ? 'active' : ''}" data-drill="${d.id}">
        <strong>${t(d.title)}</strong>${d.expectation ? `<span class="tag">${t('expectation {n}', { n: d.expectation })}</span>` : ''}
        <p>${tb(d.goal)}</p></button>`).join('')}</div>`;
    return;
  }
  if (!state.case) {
    root.innerHTML = `<h3>${t('Sandbox')}</h3><p class="empty">${tb('Free bench. Every device is unlocked and nothing is scored except technique.')}</p>`;
    return;
  }
  const c = state.case;
  root.innerHTML = `<h3>${c.title}</h3>
    <p class="brief">${c.brief}</p>
    <div class="suspects">
      ${c.suspects.map(s => `<div class="suspect">
        <strong>${s.name}</strong><span>${s.role}</span>
        <p>${s.alibi}. ${s.motive}.</p>
        ${c.chromatography ? `<p class="owns">${t('Owns:')} ${s.inkId ? c.suspects.find(x => x.id === s.id).inkId : ''}</p>` : ''}
      </div>`).join('')}
    </div>
    <p class="hint">${c.hint}</p>`;
}

function renderTechnique(root) {
  const failed = Object.entries(state.technique).filter(([, v]) => v === 'failed');
  const ok = Object.entries(state.technique).filter(([, v]) => v === 'ok');
  const { byTest } = skillHeatmap();
  const tests = Object.entries(byTest).sort((a, b) => b[1].unreliable - a[1].unreliable || b[1].runs - a[1].runs);

  root.innerHTML = `<h3>${t('Technique log')}</h3>
    ${failed.length ? `<ul class="tech-bad">${failed.map(([k]) => `<li>${tb(TECHNIQUE_FAILURES[k] || k)}</li>`).join('')}</ul>` : ''}
    ${ok.length ? `<ul class="tech-ok">${ok.map(([k]) => `<li>${t(CHECK_LABELS[k] || k.replace(/_/g, ' '))}</li>`).join('')}</ul>` : ''}
    ${tests.length ? reliabilityBlock(tests) : ''}
    ${!failed.length && !ok.length && !tests.length ? `<p class="empty">${t('Nothing recorded yet.')}</p>` : ''}`;
}

function reliabilityBlock(tests) {
  const rows = tests.map(([testId, x]) => {
    const reliable = x.runs - x.unreliable;
    const pct = Math.round((reliable / x.runs) * 100);
    const name = t(TEST_LABEL[testId]);
    return `<div class="skill-row" title="${t('{test}: {reliable} of {runs} runs gave usable evidence', { test: name, reliable, runs: x.runs })}">
      <span class="skill-name">${name}</span>
      <span class="meter"><span class="meter-fill" style="width:${pct}%"></span></span>
      <span class="skill-count">${reliable}/${x.runs}${x.unreliable ? ` <em class="skill-bad">${t('{n} spoiled', { n: x.unreliable })}</em>` : ''}</span>
    </div>`;
  }).join('');
  return `<h4>${t('Test reliability')}</h4>
    <div class="skill-heat">${rows}</div>
    <p class="hint">${tb('Runs that produced usable evidence out of runs attempted. A spoiled run came from a contaminated tool or a technique error.')}</p>`;
}

Object.assign(LAB, { renderUnknowns: renderUnknowns, renderLogbook: renderLogbook, renderQuestions: renderQuestions, renderCaseBrief: renderCaseBrief, renderTechnique: renderTechnique });
})(window.LAB);
