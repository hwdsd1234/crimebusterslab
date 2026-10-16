(function (LAB) {
'use strict';

const { BY_CATEGORY, TESTS, candidatesFor, labelFor, distinguishingTests, resolveResult, observationOptions, shuffleStable, mulberry32, INKS, INK_BY_ID, SOLVENTS } = LAB;
const { CRIME_TYPES, FIRST_NAMES, LAST_NAMES, ROLES, VICTIMS, LOCATIONS, ALIBIS, MOTIVES } = LAB;
const { t, tb } = LAB;

// Greedy selection that guarantees every chosen unknown is separable from every
// other one using the equipment on the shelf. Without this a generated case can be
// unsolvable, which is the first way a generated lab breaks.
function pickDistinguishable(pool, n, rng) {
  const order = shuffleStable(pool, Math.floor(rng() * 1e9) + 1);
  const chosen = [];
  for (const s of order) {
    if (chosen.every(c => distinguishingTests(c, s).length > 0)) {
      chosen.push(s);
      if (chosen.length === n) break;
    }
  }
  return chosen;
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function pickN(list, n, rng) {
  return shuffleStable(list, Math.floor(rng() * 1e9) + 1).slice(0, n);
}

function generateCase(seed) {
  const rng = mulberry32(seed);
  const crime = pick(CRIME_TYPES, rng);

  const unknowns = [];
  for (const category of crime.categories) {
    const pool = candidatesFor(category);
    if (!pool?.length) continue;
    const chosen = pickDistinguishable(pool, 2, rng);
    chosen.forEach(s => unknowns.push({ sampleId: s.id, category }));
  }

  const needsChromatography = !!crime.chromatography;
  const inkSet = needsChromatography ? pickN(INKS, 4, rng) : [];
  const questionedInk = inkSet[0];
  const culpritInk = inkSet[1];

  const solvent = pick(Object.keys(SOLVENTS), rng);

  const suspectCount = 4;
  const firstNames = pickN(FIRST_NAMES, suspectCount, rng);
  const lastNames = pickN(LAST_NAMES, suspectCount, rng);
  const roles = pickN(ROLES, suspectCount, rng);
  const alibis = pickN(ALIBIS, suspectCount, rng);
  const motives = pickN(MOTIVES, suspectCount, rng);

  const suspects = firstNames.map((fn, i) => ({
    id: `s${i}`,
    name: `${fn} ${lastNames[i]}`,
    role: t(roles[i]),
    alibi: t(alibis[i]),
    motive: t(motives[i]),
    possessions: [],
    inkId: null,
  }));

  const culpritIndex = Math.floor(rng() * suspects.length);
  const culprit = suspects[culpritIndex];

  // The culprit's belongings match every piece of evidence. Each distractor
  // matches all but one, so a student who identifies only some unknowns will
  // wrongly accuse someone.
  suspects.forEach((s, i) => {
    if (i === culpritIndex) {
      s.possessions = unknowns.map(u => u.sampleId);
    } else {
      const drop = Math.floor(rng() * unknowns.length);
      s.possessions = unknowns.filter((_, j) => j !== drop).map(u => u.sampleId);
    }
    if (needsChromatography) {
      s.inkId = i === culpritIndex ? culpritInk.id : inkSet[2 + (i % 2)]?.id || inkSet[2].id;
    }
  });

  const brief = tb(crime.brief, { victim: t(pick(VICTIMS, rng)), location: t(pick(LOCATIONS, rng)) });

  // Labels have to exist before the questions are written, or every prompt reads
  // "Identify white powder undefined."
  unknowns.forEach((u, i) => { u.label = `U${i + 1}`; });

  const questions = buildQuestions({
    crime, unknowns, suspects, culprit, inkSet, questionedInk, culpritInk, solvent, rng,
  });

  return {
    id: `${crime.id}-${seed}`,
    crimeType: crime.id,
    title: t(crime.title),
    brief,
    hint: tb(crime.questionHint),
    unknowns,
    suspects,
    culpritId: culprit.id,
    chromatography: needsChromatography ? { questionedInkId: questionedInk.id, culpritInkId: culpritInk.id, solvent } : null,
    questions,
    possiblePoints: questions.reduce((s, q) => s + q.points, 0),
  };
}

function buildQuestions({ crime, unknowns, suspects, culprit, inkSet, questionedInk, culpritInk, solvent, rng }) {
  const questions = [];
  let n = 0;
  const add = q => questions.push({ id: `q${++n}`, ...q });

  for (const u of unknowns) {
    const pool = candidatesFor(u.category);
    const correct = pool.find(s => s.id === u.sampleId);
    // The answer has to be seated before the pool is cut to six, otherwise a big
    // category can generate a question whose right answer is never offered.
    const distractors = shuffleStable(pool.filter(s => s.id !== u.sampleId), Math.floor(rng() * 1e9) + 1).slice(0, 5);
    add({
      kind: 'identify',
      points: 4,
      prompt: tb('Identify {category} {label}.', { category: labelFor(u.category), label: u.label }),
      options: shuffleStable([correct, ...distractors].map(s => ({ value: s.id, label: t(s.name) })), Math.floor(rng() * 1e9) + 1),
      answer: u.sampleId,
      unknownLabel: u.label,
    });
  }

  // Observation questions: one per unknown, drawn from a test that actually
  // separates this unknown from its partners.
  unknowns.forEach((u, i) => {
    const sample = BY_CATEGORY[u.category].find(s => s.id === u.sampleId);
    const partner = unknowns[(i + 1) % unknowns.length];
    const partnerSample = partner ? BY_CATEGORY[partner.category].find(s => s.id === partner.sampleId) : null;
    const separating = partnerSample ? distinguishingTests(sample, partnerSample) : TESTS.map(t => t.id);
    const testId = separating.find(t => resolveResult(sample, t)) || 'appearance';
    const options = observationOptions(u.category, testId, sample);
    if (!options) return;
    add({
      kind: 'observation',
      points: 3,
      prompt: tb('What did you observe when {test} was applied to {label}?',
        { test: t(TESTS.find(x => x.id === testId).label), label: u.label }),
      options: options.map(o => ({ value: o.token, label: t(o.text) })),
      answer: options.find(o => o.correct).token,
      unknownLabel: u.label,
      testId,
    });
  });

  if (crime.chromatography) {
    add({
      kind: 'measurement',
      points: 5,
      prompt: tb('Run the questioned ink in {solvent}. Report the Rf of its highest-travelling dye (2 decimal places).',
        { solvent: t(SOLVENTS[solvent].name) }),
      answer: Math.max(...questionedInk.dyes.map(d => d.rf[solvent])),
      tolerance: 0.06,
      chromatography: true,
    });
    add({
      kind: 'identify',
      points: 5,
      prompt: tb('Which suspect’s marker produced the writing on the note?'),
      options: suspects.map(s => ({ value: s.id, label: `${s.name} — ${t(INK_BY_ID[s.inkId].label)}` })),
      answer: suspects.find(s => s.inkId === culpritInk.id).id,
    });
  }

  if (crime.categories.includes('metal') || crime.categories.includes('glass')) {
    const target = unknowns.find(u => u.category === 'metal' || u.category === 'glass');
    if (target) {
      const sample = BY_CATEGORY[target.category].find(s => s.id === target.sampleId);
      add({
        kind: 'measurement',
        points: 5,
        prompt: tb('Determine the density of {label} in g/cm³ (2 decimal places).', { label: target.label }),
        answer: sample.density,
        tolerance: 0.15,
        unknownLabel: target.label,
        measurement: 'density',
      });
    }
  }

  if (crime.categories.includes('hair')) {
    const target = unknowns.find(u => u.category === 'hair');
    if (target) {
      const sample = BY_CATEGORY.hair.find(s => s.id === target.sampleId);
      add({
        kind: 'measurement',
        points: 5,
        prompt: tb('Measure the hair in {label} and report its medulla index (medulla width ÷ hair diameter, 2 decimal places).',
          { label: target.label }),
        answer: sample.microData.medullaIndex,
        tolerance: 0.08,
        unknownLabel: target.label,
        measurement: 'medullaIndex',
      });
    }
  }

  if (crime.categories.includes('fiber')) {
    const target = unknowns.find(u => u.category === 'fiber');
    if (target) {
      const sample = BY_CATEGORY.fiber.find(s => s.id === target.sampleId);
      add({
        kind: 'identify',
        points: 4,
        prompt: tb('A burn test on {label} gave: {odor}; residue: {residue}. Identify the fibre.',
          { label: target.label, odor: t(sample.burnData.odor), residue: t(sample.burnData.residue) }),
        options: shuffleStable(candidatesFor('fiber').map(s => ({ value: s.id, label: t(s.name) })), Math.floor(rng() * 1e9) + 1),
        answer: target.sampleId,
        unknownLabel: target.label,
      });
    }
  }

  add({
    kind: 'conclusion',
    points: 8,
    prompt: tb('Who committed the crime?'),
    options: suspects.map(s => ({ value: s.id, label: `${s.name} — ${s.role}` })),
    answer: culprit.id,
  });

  add({
    kind: 'evidence',
    points: 7,
    multi: true,
    prompt: tb('Select every piece of evidence that points at your suspect. Choosing evidence that does not match costs points.'),
    options: buildEvidenceOptions(unknowns, culprit),
    answer: culprit.possessions.slice(),
  });

  return questions;
}

function buildEvidenceOptions(unknowns, culprit) {
  const matched = new Set(culprit.possessions);
  return unknowns.map(u => ({
    value: u.sampleId,
    label: `${u.label} (${labelFor(u.category)})`,
    correct: matched.has(u.sampleId),
  }));
}

// Single-skill tasks mapped one-to-one onto the four Core Lab Expectations.
const DRILLS = [
  {
    id: 'ppe', expectation: 1, title: 'Dress for the lab',
    goal: 'Put on the correct PPE before touching anything.',
    devices: ['kit_box'],
  },
  {
    id: 'flame', expectation: 2, title: 'Light and heat safely',
    goal: 'Heat a test tube correctly: one third full, clamped near the top, pointed away.',
    devices: ['test_tube', 'test_tube_holder', 'test_tube_brush', 'heat_source'],
  },
  {
    id: 'chromatography', expectation: 3, title: 'Strip and sheet chromatography with Rf',
    goal: 'Mark a pencil baseline, develop a strip, and calculate Rf for every dye.',
    devices: ['pencil', 'ruler', 'petri_dish', 'beaker'],
  },
  {
    id: 'measuring', expectation: 4, title: 'Use the measuring instruments',
    goal: 'Read a meniscus at eye level, measure pH without dipping, and test conductivity.',
    devices: ['graduated_cylinder', 'ph', 'conductivity', 'thermometer', 'ruler'],
  },
  {
    id: 'unknown_powder', title: 'Identify four unknown powders',
    goal: 'Use spot-plate tests, pH, and conductivity to identify every powder.',
    devices: ['spot_plate', 'dropper', 'spatula', 'ph', 'conductivity', 'hand_lens'],
  },
  {
    id: 'unknown_fiber', title: 'Identify three unknown fibres',
    goal: 'Use burn tests, acetone solubility, and microscopy.',
    devices: ['heat_source', 'tweezers', 'microscope', 'spot_plate'],
  },
];

Object.assign(LAB, { generateCase: generateCase, DRILLS: DRILLS });
})(window.LAB);
