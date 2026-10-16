(function (LAB) {
'use strict';

// Paper chromatography model. An ink is a set of dyes; each dye has an Rf per solvent.
// Rf = distance the dye travelled / distance the solvent front travelled.

const SOLVENTS = {
  water:   { id: 'water',   name: 'Water',            color: '#cfe6f5' },
  ethanol: { id: 'ethanol', name: 'Rubbing Alcohol',  color: '#e8f0e8' },
  acetone: { id: 'acetone', name: 'Acetone',          color: '#eef4f8' },
};

const DYE_LIBRARY = [
  { name: 'yellow',  color: '#d9a520' },
  { name: 'red',     color: '#c0392b' },
  { name: 'blue',    color: '#2f6fb0' },
  { name: 'green',   color: '#2e8b57' },
  { name: 'violet',  color: '#7d5ba6' },
  { name: 'orange',  color: '#d9722c' },
  { name: 'cyan',    color: '#1f9bb5' },
  { name: 'magenta', color: '#b5317f' },
];

// rfBySolvent is authored per dye per ink so the same ink separates differently in
// water than in alcohol — which is exactly what students must discover.
function ink(id, label, dyes) {
  return { id, label, kind: 'ink', dyes };
}

const INKS = [
  ink('ink_a', 'Black marker A', [
    { name: 'yellow',  color: '#d9a520', rf: { water: 0.78, ethanol: 0.62, acetone: 0.70 } },
    { name: 'blue',    color: '#2f6fb0', rf: { water: 0.41, ethanol: 0.55, acetone: 0.33 } },
    { name: 'red',     color: '#c0392b', rf: { water: 0.15, ethanol: 0.28, acetone: 0.20 } },
  ]),
  ink('ink_b', 'Black marker B', [
    { name: 'cyan',    color: '#1f9bb5', rf: { water: 0.66, ethanol: 0.48, acetone: 0.59 } },
    { name: 'magenta', color: '#b5317f', rf: { water: 0.52, ethanol: 0.71, acetone: 0.44 } },
    { name: 'yellow',  color: '#d9a520', rf: { water: 0.24, ethanol: 0.35, acetone: 0.30 } },
  ]),
  ink('ink_c', 'Black marker C', [
    { name: 'blue',    color: '#2f6fb0', rf: { water: 0.35, ethanol: 0.44, acetone: 0.51 } },
    { name: 'red',     color: '#c0392b', rf: { water: 0.61, ethanol: 0.52, acetone: 0.66 } },
    { name: 'green',   color: '#2e8b57', rf: { water: 0.88, ethanol: 0.74, acetone: 0.81 } },
  ]),
  ink('ink_d', 'Blue ballpoint', [
    { name: 'cyan',    color: '#1f9bb5', rf: { water: 0.72, ethanol: 0.83, acetone: 0.69 } },
    { name: 'violet',  color: '#7d5ba6', rf: { water: 0.29, ethanol: 0.46, acetone: 0.38 } },
  ]),
  ink('ink_e', 'Black ballpoint', [
    { name: 'blue',    color: '#2f6fb0', rf: { water: 0.57, ethanol: 0.40, acetone: 0.62 } },
    { name: 'orange',  color: '#d9722c', rf: { water: 0.33, ethanol: 0.58, acetone: 0.27 } },
    { name: 'violet',  color: '#7d5ba6', rf: { water: 0.11, ethanol: 0.19, acetone: 0.14 } },
  ]),
  ink('ink_f', 'Green marker', [
    { name: 'yellow',  color: '#d9a520', rf: { water: 0.69, ethanol: 0.55, acetone: 0.61 } },
    { name: 'cyan',    color: '#1f9bb5', rf: { water: 0.45, ethanol: 0.63, acetone: 0.50 } },
  ]),
  ink('ink_g', 'Purple marker', [
    { name: 'magenta', color: '#b5317f', rf: { water: 0.58, ethanol: 0.47, acetone: 0.66 } },
    { name: 'blue',    color: '#2f6fb0', rf: { water: 0.31, ethanol: 0.52, acetone: 0.36 } },
    { name: 'orange',  color: '#d9722c', rf: { water: 0.82, ethanol: 0.68, acetone: 0.75 } },
  ]),
  ink('ink_h', 'Red marker', [
    { name: 'red',     color: '#c0392b', rf: { water: 0.74, ethanol: 0.60, acetone: 0.80 } },
    { name: 'orange',  color: '#d9722c', rf: { water: 0.42, ethanol: 0.55, acetone: 0.48 } },
  ]),
];

const INK_BY_ID = Object.fromEntries(INKS.map(i => [i.id, i]));

// Two inks are "the same ink" when their dye sets match closely enough.
function inksMatch(a, b, solvent, tolerance = 0.06) {
  if (a.dyes.length !== b.dyes.length) return false;
  return a.dyes.every(da => {
    const db = b.dyes.find(x => x.name === da.name);
    if (!db) return false;
    return Math.abs(da.rf[solvent] - db.rf[solvent]) <= tolerance;
  });
}

Object.assign(LAB, { SOLVENTS: SOLVENTS, INKS: INKS, INK_BY_ID: INK_BY_ID, inksMatch: inksMatch });
})(window.LAB);
