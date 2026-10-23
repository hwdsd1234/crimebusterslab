(function (LAB) {
'use strict';

const { BY_ID, BY_CATEGORY, TESTS, candidatesFor, labelFor, distinguishingTests, resolveResult, observationOptions, shuffleStable, mulberry32, INKS, INK_BY_ID, SOLVENTS } = LAB;
const { CRIME_TYPES, FIRST_NAMES, LAST_NAMES, ROLES, PLACES, VICTIMS, LOCATIONS, TIMES_LOCKED, TIMES_FOUND, ALIBIS_VERIFIED, ALIBIS_UNVERIFIED, MOTIVES } = LAB;
const { t, tb, tVars } = LAB;

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

// A look-alike for an innocent suspect's item. 'far' takes one that many tests tell
// apart from the evidence, 'near' one that only a single test separates.
function pickLookAlike(list, truth, how, rng) {
  if (how === 'any') return pick(list, rng);
  const gap = x => distinguishingTests(x, truth).length;
  const best = how === 'far' ? Math.max(...list.map(gap)) : Math.min(...list.map(gap));
  return pick(list.filter(x => gap(x) === best), rng);
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function pickN(list, n, rng) {
  return shuffleStable(list, Math.floor(rng() * 1e9) + 1).slice(0, n);
}

// How hard a case is. Easy cases have fewer suspects, each innocent one differing
// from the evidence in two places with an obvious look-alike, and wider answer
// tolerances. Hard cases have more suspects, each one item off with the closest
// look-alike there is, more unverified alibis, and tighter tolerances.
const DIFFICULTY = {
  easy: { suspects: 3, swaps: () => 2, shaky: 1, lookAlike: 'far', tolerance: 1.5 },
  normal: { suspects: 4, swaps: i => 1 + (i % 2), shaky: 1, lookAlike: 'any', tolerance: 1 },
  hard: { suspects: 5, swaps: () => 1, shaky: 2, lookAlike: 'near', tolerance: 0.7 },
};

function generateCase(seed, difficulty = 'normal') {
  const level = DIFFICULTY[difficulty] || DIFFICULTY.normal;
  const rng = mulberry32(seed);
  const crime = pick(CRIME_TYPES, rng);

  const unknowns = [];
  for (const category of crime.categories) {
    const pool = candidatesFor(category);
    if (!pool?.length) continue;
    const chosen = pickDistinguishable(pool, 2, rng);
    chosen.forEach((s, k) => unknowns.push({ sampleId: s.id, category, where: crime.where?.[category]?.[k] || null }));
  }
  // Labels have to exist before the questions are written, or every prompt reads
  // "Identify white powder undefined."
  unknowns.forEach((u, i) => {
    u.label = `U${i + 1}`;
    if (u.where) u.where = t(u.where);
  });

  const solvent = pick(Object.keys(SOLVENTS), rng);

  const suspectCount = level.suspects;
  const firstNames = pickN(FIRST_NAMES, suspectCount, rng);
  const lastNames = pickN(LAST_NAMES, suspectCount, rng);
  const roles = pickN(ROLES, suspectCount, rng);
  const motives = pickN(MOTIVES, suspectCount, rng);

  const culpritIndex = Math.floor(rng() * suspectCount);
  // The culprit and one or more innocent suspects have only their own word for an alibi.
  const start = culpritIndex + 1 + Math.floor(rng() * (suspectCount - 1));
  const shakyIndexes = [culpritIndex, ...Array.from({ length: level.shaky }, (_, k) => (start + k) % suspectCount)];
  const verified = pickN(ALIBIS_VERIFIED, suspectCount, rng);
  const unverified = pickN(ALIBIS_UNVERIFIED, shakyIndexes.length, rng);

  const suspects = firstNames.map((fn, i) => {
    const shaky = shakyIndexes.includes(i);
    return {
      id: `s${i}`,
      name: `${fn} ${lastNames[i]}`,
      role: t(roles[i]),
      alibi: t(shaky ? unverified[shakyIndexes.indexOf(i)] : verified[i]),
      alibiVerified: !shaky,
      motive: t(motives[i]),
      items: [],
      possessions: [],
      inkId: null,
    };
  });
  const culprit = suspects[culpritIndex];

  // Every suspect hands over one item per piece of evidence. The culprit's items are
  // the evidence; each innocent suspect's set differs in one or two places, with a
  // look-alike from the same category. Identifying only some unknowns, or mixing up
  // two similar ones, points at the wrong person.
  const evidenceIds = new Set(unknowns.map(u => u.sampleId));
  let rotate = Math.floor(rng() * unknowns.length);
  suspects.forEach((s, i) => {
    const items = unknowns.map(u => ({ sampleId: u.sampleId, category: u.category, place: t(pick(PLACES[u.category] || ['bag'], rng)) }));
    if (i !== culpritIndex) {
      const swaps = level.swaps(i);
      for (let k = 0; k < swaps && k < items.length; k++) {
        const j = (rotate++) % items.length;
        const truth = BY_ID[unknowns[j].sampleId];
        const lookAlikes = candidatesFor(unknowns[j].category)
          .filter(x => !evidenceIds.has(x.id) && distinguishingTests(x, truth).length > 0);
        if (lookAlikes.length) items[j].sampleId = pickLookAlike(lookAlikes, truth, level.lookAlike, rng).id;
        else items[j].missing = true;
      }
    }
    s.items = items.filter(x => !x.missing);
    s.possessions = s.items.map(x => x.sampleId);
  });

  // Every suspect owns a different ink and the note was written with the culprit's.
  const needsChromatography = !!crime.chromatography;
  if (needsChromatography) {
    const inkSet = pickN(INKS, suspectCount, rng);
    suspects.forEach((s, i) => { s.inkId = inkSet[i].id; });
  }

  const victim = t(pick(VICTIMS, rng));
  const location = t(pick(LOCATIONS, rng));
  const brief = tb(crime.brief, { victim, location });
  const clues = [
    tb('Timeline: {location} was last checked at {t1}. The incident was discovered at {t2}.',
      { location, t1: pick(TIMES_LOCKED, rng), t2: pick(TIMES_FOUND, rng) }),
    ...(crime.clues || []).map(c => tb(c)),
    tb('Each suspect handed over the items listed on their card. Match every item against the evidence you identify.'),
  ];

  const questions = buildQuestions({ crime, unknowns, suspects, culprit, solvent, rng, tolerance: level.tolerance });

  return {
    id: `${crime.id}-${seed}-${difficulty}`,
    crimeType: crime.id,
    difficulty,
    title: t(crime.title),
    brief,
    clues,
    hint: tb(crime.questionHint),
    unknowns,
    suspects,
    culpritId: culprit.id,
    chromatography: needsChromatography ? { questionedInkId: culprit.inkId, solvent } : null,
    questions,
    possiblePoints: questions.reduce((s, q) => s + q.points, 0),
  };
}

function buildQuestions({ crime, unknowns, suspects, culprit, solvent, rng, tolerance = 1 }) {
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
    // Prefer a bench test over plain appearance, so the question rewards running it.
    const usable = separating.filter(id => id !== 'appearance' && id !== 'density' && resolveResult(sample, id));
    const testId = usable.length ? pick(usable, rng) : separating.find(id => resolveResult(sample, id)) || 'appearance';
    const options = observationOptions(u.category, testId, sample);
    if (!options) return;
    add({
      kind: 'observation',
      points: 3,
      prompt: tb('What did you observe when {test} was applied to {label}?',
        { test: t(TESTS.find(x => x.id === testId).label), label: u.label }),
      options: options.map(o => ({ value: o.token, label: o.vars ? tVars(o.key, o.vars) : t(o.text) })),
      answer: options.find(o => o.correct).token,
      unknownLabel: u.label,
      testId,
    });
  });

  if (crime.chromatography) {
    const noteInk = INK_BY_ID[culprit.inkId];
    add({
      kind: 'measurement',
      points: 5,
      prompt: tb('Run the ink from the note in {solvent}. Report the Rf of its highest-travelling dye (2 decimal places).',
        { solvent: t(SOLVENTS[solvent].name) }),
      answer: Math.max(...noteInk.dyes.map(d => d.rf[solvent])),
      tolerance: +(0.04 * tolerance).toFixed(3),
      chromatography: true,
    });
    add({
      kind: 'identify',
      points: 5,
      prompt: tb('Which suspect’s marker produced the writing on the note?'),
      options: suspects.map(s => ({ value: s.id, label: `${s.name} — ${t(INK_BY_ID[s.inkId].label)}` })),
      answer: culprit.id,
    });
  }

  const DENSITY_CATEGORIES = ['metal', 'glass', 'plastic'];
  if (crime.categories.some(c => DENSITY_CATEGORIES.includes(c))) {
    const target = unknowns.find(u => DENSITY_CATEGORIES.includes(u.category));
    if (target) {
      const sample = BY_CATEGORY[target.category].find(s => s.id === target.sampleId);
      add({
        kind: 'measurement',
        points: 5,
        prompt: tb('Determine the density of {label} in g/cm³ (2 decimal places).', { label: target.label }),
        answer: sample.density,
        tolerance: +(0.15 * tolerance).toFixed(3),
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
        tolerance: +(0.08 * tolerance).toFixed(3),
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

  // One "what clears them" question per innocent suspect, up to two: the student has
  // to say which identified evidence fails to match that suspect's belongings.
  suspects.filter(s => s.id !== culprit.id).slice(0, 2).forEach(s => {
    const mismatched = unknowns.filter(u => !s.possessions.includes(u.sampleId)).map(u => u.sampleId);
    add({
      kind: 'evidence',
      points: 4,
      multi: true,
      prompt: tb('Select every piece of evidence that does NOT match {name}’s belongings. A wrong pick costs points.', { name: s.name }),
      options: unknowns.map(u => ({ value: u.sampleId, label: `${u.label} (${labelFor(u.category)})` })),
      answer: mismatched,
    });
  });

  return questions;
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
    devices: ['graduated_cylinder', 'ph', 'conductivity', 'balance', 'ruler'],
  },
  {
    id: 'unknown_powder', title: 'Identify four unknown powders',
    goal: 'Use spot-plate tests, pH, and conductivity to identify every powder.',
    devices: ['spot_plate', 'dropper', 'spatula', 'ph', 'conductivity', 'hand_lens'],
  },
  {
    id: 'unknown_fiber', title: 'Identify three unknown fibres',
    goal: 'Use burn tests and microscopy.',
    devices: ['heat_source', 'tweezers', 'microscope', 'spot_plate'],
  },
];

Object.assign(LAB, { generateCase: generateCase, DRILLS: DRILLS, DIFFICULTY: DIFFICULTY });
})(window.LAB);
