(function (LAB) {
'use strict';

const { state, ppePoints } = LAB;
const { DEVICES } = LAB;
const { t } = LAB;

function techniquePoints() {
  let earned = 0, possible = 0;
  for (const d of DEVICES) {
    for (const c of d.checks || []) {
      possible += c.points;
      if (state.technique[c.id] === 'ok') earned += c.points;
    }
  }
  return { earned, possible };
}

function gradeQuestion(q) {
  const given = state.answers[q.id];
  if (given == null || (Array.isArray(given) && given.length === 0)) {
    return { earned: 0, possible: q.points, status: 'unanswered' };
  }

  if (q.kind === 'measurement') {
    const value = typeof given === 'string' ? parseFloat(given) : given;
    if (Number.isNaN(value)) return { earned: 0, possible: q.points, status: 'wrong' };
    const off = Math.abs(value - q.answer);
    if (off <= q.tolerance) return { earned: q.points, possible: q.points, status: 'correct' };
    if (off <= q.tolerance * 2.5) return { earned: Math.round(q.points * 0.4), possible: q.points, status: 'close' };
    return { earned: 0, possible: q.points, status: 'wrong' };
  }

  if (q.kind === 'evidence') {
    const correctSet = new Set(q.answer);
    const givenSet = new Set(given);
    let earned = 0;
    for (const v of givenSet) if (correctSet.has(v)) earned += q.points / correctSet.size;
    for (const v of givenSet) if (!correctSet.has(v)) earned -= q.points / correctSet.size;
    return { earned: Math.max(0, Math.round(earned)), possible: q.points, status: earned >= q.points ? 'correct' : earned > 0 ? 'partial' : 'wrong' };
  }

  return given === q.answer
    ? { earned: q.points, possible: q.points, status: 'correct' }
    : { earned: 0, possible: q.points, status: 'wrong' };
}

function grade() {
  const rows = [];
  let earned = 0, possible = 0;

  if (state.case) {
    for (const q of state.case.questions) {
      const r = gradeQuestion(q);
      rows.push({ label: q.prompt, ...r });
      earned += r.earned;
      possible += r.possible;
    }
  }

  const tech = techniquePoints();
  rows.push({ label: t('Technique — correct use of the equipment on the shelf'), ...tech });
  earned += tech.earned;
  possible += tech.possible;

  const ppe = { earned: ppePoints(), possible: 8 };
  rows.push({ label: t('Safety — PPE worn before starting'), ...ppe });
  earned += ppe.earned;
  possible += ppe.possible;

  state.score = { earned, possible };
  return { rows, earned, possible };
}

function skillHeatmap() {
  const byTest = {};
  for (const [label, tests] of Object.entries(state.observations)) {
    for (const [testId, r] of Object.entries(tests)) {
      byTest[testId] ||= { runs: 0, unreliable: 0 };
      byTest[testId].runs++;
      if (!r.valid) byTest[testId].unreliable++;
    }
  }
  const failedChecks = Object.entries(state.technique).filter(([, v]) => v === 'failed').map(([k]) => k);
  return { byTest, failedChecks };
}

Object.assign(LAB, { techniquePoints: techniquePoints, grade: grade, skillHeatmap: skillHeatmap });
})(window.LAB);
