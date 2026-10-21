(function (LAB) {
'use strict';

const { state } = LAB;
const { TESTS } = LAB;
const { TECHNIQUE_FAILURES, CHECK_LABELS } = LAB;
const { grade, gradeQuestion, skillHeatmap } = LAB;
const { t, tb } = LAB;

const TEST_LABEL = Object.fromEntries(TESTS.map(x => [x.id, x.label]));
// A scorecard verdict is UI vocabulary, but 'partial' is also a solubility token in the
// sample data — sharing one key gives the scorecard the chemistry wording.
const STATUS_LABEL = { unanswered: 'unanswered', correct: 'correct', close: 'close', partial: 'partially correct', wrong: 'wrong' };

function answered(q) {
  const given = state.answers[q.id];
  return given != null && given !== '' && !(Array.isArray(given) && given.length === 0);
}

// Case answers are graded only once the report is submitted. A live score next to
// each answer would let a student flip through the options until one turns green.
function renderQuestions(root) {
  const { rows } = grade();

  if (!state.case) {
    root.innerHTML = `<h3>${t('Lab report')}</h3>
      <p class="empty">${tb('Start a case to get a scored test. Technique and safety points still count here.')}</p>
      ${scorecard(rows, true)}`;
    return;
  }

  const done = state.case.questions.filter(answered).length;
  const total = state.case.questions.length;
  const submitted = !!state.submitted;
  const culprit = state.case.suspects.find(s => s.id === state.case.culpritId);

  root.innerHTML = `<div class="report-head">
      <h3>${t('Lab report')}</h3>
      <span class="progress">${t('{done} of {total} answered', { done, total })}</span>
    </div>
    ${submitted ? `<p class="verdict">${t('Report submitted. The culprit was {name}.', { name: `<strong>${culprit.name}</strong>` })}</p>` : ''}
    <ol class="questions">
      ${state.case.questions.map(q => {
        const g = submitted ? gradeQuestion(q) : null;
        return `<li class="question ${g ? g.status : answered(q) ? 'answered' : ''}">
        <p class="q-prompt">${q.prompt} <span class="q-pts">${g ? `${g.earned}/${q.points}` : t('{n} pts', { n: q.points })}</span></p>
        ${controlFor(q, submitted)}
        ${g && g.status !== 'correct' ? `<p class="q-answer">${t('Expected:')} ${expectedText(q)}</p>` : ''}
      </li>`;
      }).join('')}
    </ol>
    ${submitted
      ? scorecard(rows, true)
      : `<div class="submit-row">
          <button class="btn primary" id="submitReport" ${done ? '' : 'disabled'}>${t('Submit report')}</button>
          <span class="hint">${t('Answers are graded when you submit. You cannot change them afterwards.')}</span>
        </div>
        ${scorecard(rows.slice(-2), true)}`}`;
}

function expectedText(q) {
  if (q.kind === 'measurement') return q.answer.toFixed(2);
  if (q.kind === 'evidence') {
    const set = new Set(q.answer);
    const picks = q.options.filter(o => set.has(o.value)).map(o => o.label);
    return picks.length ? picks.join(', ') : t('none — everything matches');
  }
  return q.options.find(o => o.value === q.answer)?.label || q.answer;
}

function scorecard(rows, showStatus) {
  return `<div class="scorecard">
    <table class="table"><thead><tr><th>${t('Section')}</th><th>${t('Points')}</th>${showStatus ? `<th>${t('Result')}</th>` : ''}</tr></thead>
    <tbody>${rows.map(r => `<tr><td>${r.label}</td><td>${r.earned}/${r.possible}</td>${showStatus ? `<td>${r.status ? t(STATUS_LABEL[r.status]) : ''}</td>` : ''}</tr>`).join('')}</tbody></table>
    <p class="total">${rows.reduce((s, r) => s + r.earned, 0)} / ${rows.reduce((s, r) => s + r.possible, 0)}</p>
  </div>`;
}

function controlFor(q, locked) {
  const given = state.answers[q.id];
  const dis = locked ? 'disabled' : '';

  if (q.kind === 'measurement') {
    return `<label class="field inline"><span>${t('Answer')}</span>
      <input class="answer" type="number" step="0.01" inputmode="decimal" data-question="${q.id}" value="${given ?? ''}" ${dis}/></label>`;
  }

  if (q.kind === 'evidence') {
    const chosen = new Set(given || []);
    return `<div class="choices">${q.options.map(o => `<label class="choice">
      <input class="answer" type="checkbox" data-question="${q.id}" value="${o.value}" ${chosen.has(o.value) ? 'checked' : ''} ${dis}/> ${o.label}
    </label>`).join('')}</div>`;
  }

  return `<select class="answer" data-question="${q.id}" ${dis}>
    <option value="">${t('— choose —')}</option>
    ${q.options.map(o => `<option value="${o.value}" ${o.value === given ? 'selected' : ''}>${o.label}</option>`).join('')}
  </select>`;
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

Object.assign(LAB, { renderQuestions: renderQuestions, renderTechnique: renderTechnique });
})(window.LAB);
