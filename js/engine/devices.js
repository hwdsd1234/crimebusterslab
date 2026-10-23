(function (LAB) {
'use strict';

// The items from the 2026 Div. B Chemistry Lab Equipment List that the core Crime
// Busters tests use, each with the technique the real event actually grades.

const DEVICES = [
  { id: 'kit_box', name: 'Kit Box', group: 'Setup', use: 'Contains all of the kit materials', station: 'kit', icon: 'box' },

  { id: 'graduated_cylinder', name: 'Graduated Cylinders (10–100 mL)', group: 'Glassware', use: 'Measuring volumes', station: 'volume', icon: 'cylinder',
    checks: [
      { id: 'meniscus_eye_level', label: 'Read the meniscus at eye level', points: 2 },
      { id: 'cylinder_size_match', label: 'Chose the cylinder closest to the volume needed', points: 2 },
    ] },

  { id: 'beaker', name: 'Beakers (50–500 mL)', group: 'Glassware', use: 'Doing reactions, developing chromatograms', station: 'chromatography', icon: 'beaker' },

  { id: 'erlenmeyer', name: 'Erlenmeyer Flasks (50–250 mL)', group: 'Glassware', use: 'Doing reactions', station: 'flask', icon: 'flask',
    checks: [
      { id: 'swirl_not_stir', label: 'Swirled the flask instead of stirring it', points: 1 },
    ] },

  { id: 'test_tube', name: 'Test Tubes', group: 'Glassware', use: 'Mix chemicals, heat chemicals', station: 'test_tube', icon: 'tube',
    checks: [
      { id: 'heat_fill_third', label: 'Filled no more than one third when heating', points: 2 },
      { id: 'heat_aim_away', label: 'Pointed the tube away from people when heating', points: 2 },
    ] },

  { id: 'test_tube_brush', name: 'Test Tube Brush', group: 'Hand Tools', use: 'Clean test tubes', station: 'clean', icon: 'brush' },
  { id: 'test_tube_holder', name: 'Test Tube Holder', group: 'Hand Tools', use: 'Holds test tubes for heating', station: 'test_tube', icon: 'holder',
    checks: [
      { id: 'clamp_top', label: 'Clamped the tube near the top, not the middle', points: 1 },
    ] },
  { id: 'test_tube_rack', name: 'Test Tube Rack', group: 'Glassware', use: 'Hold test tubes', station: 'test_tube', icon: 'rack' },

  { id: 'petri_dish', name: 'Petri Dishes', group: 'Glassware', use: 'Doing reactions, developing chromatograms', station: 'chromatography', icon: 'petri',
    checks: [
      { id: 'solvent_below_baseline', label: 'Kept the solvent level below the baseline', points: 2 },
    ] },
  { id: 'spot_plate', name: 'Spot Plates', group: 'Glassware', use: 'Semi-micro scale reactions, testing solubility, pH', station: 'spot_plate', icon: 'spotplate',
    checks: [
      { id: 'label_wells', label: 'Labelled which unknown went in which well', points: 2 },
      { id: 'one_drop_each', label: 'Used one drop of sample and one drop of reagent', points: 1 },
    ] },

  // One shelf entry for both: mounting a sample and lowering the cover slip over it is a
  // single bench operation, and the two entries opened the identical page. Both stay on
  // the equipment list and the cover slip's technique check still counts.
  { id: 'slide', name: 'Slides', shelfName: 'Slides & Cover Slips', group: 'Glassware', use: 'To put hairs, crystals, or fibers on for use with a microscope', station: 'microscope', icon: 'slide' },
  { id: 'cover_slip', name: 'Cover Slips', withDevice: 'slide', group: 'Glassware', use: 'To prevent items from coming off slides', station: 'microscope', icon: 'coverslip',
    checks: [
      { id: 'lower_cover_45', label: 'Lowered the cover slip at an angle to avoid trapped bubbles', points: 2 },
    ] },

  { id: 'dropper', name: 'Droppers', group: 'Hand Tools', use: 'Add small amounts of liquids to reactions', station: 'spot_plate', icon: 'dropper',
    checks: [
      { id: 'tip_not_touched', label: 'Did not touch the dropper tip to the sample', points: 2 },
      { id: 'rinsed_between_samples', label: 'Rinsed the dropper between samples', points: 2 },
    ] },

  { id: 'spatula', name: 'Spatulas or Spoons', group: 'Hand Tools', use: 'Getting small amounts of solids out of containers', station: 'spot_plate', icon: 'spatula',
    checks: [
      { id: 'cleaned_between_samples', label: 'Cleaned the spatula between samples', points: 2 },
    ] },

  { id: 'stirring_rod', name: 'Stirring Rods', group: 'Hand Tools', use: 'Stirring mixtures', station: 'spot_plate', icon: 'rod' },
  { id: 'tweezers', name: 'Metal Tongs, Forceps, or Tweezers', group: 'Hand Tools', use: 'Holding objects, retrieving objects from liquids', station: 'retrieve', icon: 'tweezers' },
  { id: 'ph', name: 'pH Paper / Meter', group: 'Measuring', use: 'Test acidity or alkalinity of solution', station: 'ph', icon: 'phpaper',
    checks: [
      { id: 'no_dipping', label: 'Did not dip pH paper into the solution', points: 3 },
    ] },

  { id: 'hand_lens', name: 'Hand Lens', group: 'Measuring', use: 'Magnification of small items for identification', station: 'magnify', icon: 'lens' },
  { id: 'conductivity', name: '9V or less Battery Conductivity Tester', group: 'Measuring', use: 'Determining ionic strength of solution', station: 'conductivity', icon: 'conductivity',
    checks: [
      { id: 'electrodes_apart', label: 'Kept the two electrodes from touching', points: 1 },
      { id: 'rinsed_electrodes', label: 'Rinsed the electrodes between samples', points: 2 },
    ] },

  { id: 'paper_towels', name: 'Paper Towels', group: 'Consumables', use: 'Cleaning', station: 'clean', icon: 'towel' },
  { id: 'pencil', name: 'Pencil', group: 'Consumables', use: 'Writing, marking chromatogram', station: 'chromatography', icon: 'pencil',
    checks: [
      { id: 'pencil_not_pen', label: 'Marked the chromatogram baseline in pencil, not pen', points: 3 },
    ] },
  { id: 'ruler', name: 'Ruler', group: 'Measuring', use: 'Measuring lengths', station: 'chromatography', icon: 'ruler',
    checks: [
      { id: 'measure_from_baseline', label: 'Measured distances from the baseline, not the strip edge', points: 2 },
      { id: 'mm_precision', label: 'Recorded distances to the nearest millimetre', points: 1 },
    ] },
];

// Not on the equipment list. The event provides these; verify against the current
// rules manual before treating them as team-supplied.
const EVENT_PROVIDED = [
  { id: 'microscope', name: 'Microscope', group: 'Provided', use: 'Provided at the event — Slides and Cover Slips both reference it', station: 'microscope', icon: 'microscope', provided: true },
  { id: 'heat_source', name: 'Hot Plate / Flame', group: 'Provided', use: 'Needed for heating and burn tests — check whether open flame is allowed at your table', station: 'burn', icon: 'flame', provided: true,
    checks: [
      { id: 'burn_tweezers', label: 'Held burn samples with tweezers in the hood', points: 2 },
    ] },
  { id: 'balance', name: 'Balance', group: 'Provided', use: 'Needed for density measurements', station: 'density', icon: 'balance', provided: true,
    checks: [
      { id: 'tare_balance', label: 'Zeroed the balance with the weighing paper on it', points: 1 },
    ] },
];

// Practice aids that are not on the equipment list, so they carry no technique checks.
const HELPERS = [
  { id: 'id_sheet', name: 'ID Sheet', group: 'Practice', use: 'Write down what you think each unknown is and check it', station: 'identify', icon: 'idsheet', sandboxOnly: true },
];

const DEVICE_BY_ID = Object.fromEntries([...DEVICES, ...EVENT_PROVIDED, ...HELPERS].map(d => [d.id, d]));
// The shelf is ordered by how often a test comes up in a case, so the spot-plate
// tests every unknown needs sit at the top and the rarer measurements sit below.
const GROUPS = [
  { name: 'Safety first', ids: ['kit_box'] },
  { name: 'Most common: spot plate tests', hint: 'Water, vinegar, iodine, pH', ids: ['spot_plate', 'dropper', 'spatula', 'stirring_rod', 'ph', 'hand_lens'] },
  { name: 'Common: burn, microscope, ink', hint: 'Fibres, hair, chromatography', ids: ['heat_source', 'tweezers', 'slide', 'microscope', 'petri_dish', 'pencil', 'ruler', 'beaker'] },
  { name: 'Less common: conductivity, density', hint: 'Salts, metals, glass, plastic', ids: ['conductivity', 'balance', 'graduated_cylinder', 'test_tube', 'test_tube_holder', 'test_tube_rack', 'erlenmeyer'] },
  { name: 'Clean-up', ids: ['paper_towels', 'test_tube_brush'] },
];
const CHECK_LABELS = Object.fromEntries([...DEVICES, ...EVENT_PROVIDED].flatMap(d => (d.checks || []).map(c => [c.id, c.label])));

const PPE = [
  { id: 'goggles', name: 'Goggles', points: 3 },
  { id: 'apron', name: 'Apron', points: 2 },
  { id: 'gloves', name: 'Gloves', points: 1 },
  { id: 'tied_hair', name: 'Tied-back hair', points: 1 },
  { id: 'closed_shoes', name: 'Closed-toe shoes', points: 1 },
];

// Technique checks that are graded by absence: the student loses the points by
// doing the wrong thing, and the log shows what went wrong.
const TECHNIQUE_FAILURES = {
  meniscus_eye_level: 'Read the cylinder from above — parallax makes the volume wrong',
  cylinder_size_match: 'Used a 100 mL cylinder for a small volume — too coarse to read',
  swirl_not_stir: 'Stirred the flask with a rod instead of swirling it',
  heat_fill_third: 'Heated a test tube more than one third full — it boiled over',
  heat_aim_away: 'Pointed a heated test tube toward someone',
  clamp_top: 'Clamped the test tube in the middle instead of near the top',
  label_wells: 'Ran tests in unlabelled wells — results cannot be traced back',
  one_drop_each: 'Used too much sample or reagent in the well',
  lower_cover_45: 'Dropped the cover slip flat — trapped bubbles are now in the field of view',
  tip_not_touched: 'Touched the dropper tip to the sample — the reagent bottle is now contaminated',
  rinsed_between_samples: 'Used the same dropper on two samples without rinsing — cross-contamination',
  cleaned_between_samples: 'Used the same spatula on two samples — cross-contamination',
  no_dipping: 'Dipped pH paper straight into the solution — the whole sample is now contaminated',
  electrodes_apart: 'Let the conductivity electrodes touch — short circuit, false reading',
  rinsed_electrodes: 'Did not rinse the conductivity electrodes between samples',
  pencil_not_pen: 'Marked the baseline in pen — the pen ink ran with the solvent and ruined the strip',
  measure_from_baseline: 'Measured Rf from the bottom edge of the strip instead of the baseline',
  mm_precision: 'Recorded a distance without millimetre precision',
  solvent_below_baseline: 'Poured the solvent above the baseline — the spots dissolved into the solvent pool',
  burn_tweezers: 'Ran a burn test without tweezers or the hood — unsafe and it would cost you at the event',
  tare_balance: 'Weighed without zeroing the balance — the weighing paper is counted in the mass',
};

Object.assign(LAB, { DEVICES: DEVICES, EVENT_PROVIDED: EVENT_PROVIDED, HELPERS: HELPERS, DEVICE_BY_ID: DEVICE_BY_ID, GROUPS: GROUPS, CHECK_LABELS: CHECK_LABELS, PPE: PPE, TECHNIQUE_FAILURES: TECHNIQUE_FAILURES });
})(window.LAB);
