(function (LAB) {
'use strict';

// Glass, soil, plastics, tablets, and print patterns.

const SAMPLES = [

  // ─────────────────────────── GLASS ───────────────────────────
  {
    id: 'bottle_glass', name: 'Bottle Glass (soda-lime)', formula: 'Na₂O·CaO·SiO₂', category: 'glass',
    appearance: 'Pale green tint, curved shard edges',
    density: 2.49, hardness: 5.5, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['pale green shard', 'Pale green tint; curved edges matching a bottle wall'],
      density: ['ρ 2.49', 'Density 2.49 g/cm³ — sinks in water'],
      burn: ['no burn', 'Does not burn; softens only at very high temperature'],
      micro: ['curved shard', 'Shard with a curved surface; conchoidal fracture lines'],
    },
  },
  {
    id: 'window_glass', name: 'Window Glass (float)', formula: 'Na₂O·CaO·SiO₂', category: 'glass',
    appearance: 'Colourless, one surface perfectly flat',
    density: 2.50, hardness: 5.5, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['colourless flat shard', 'Colourless; one face perfectly flat from the float process'],
      density: ['ρ 2.50', 'Density 2.50 g/cm³ — sinks in water'],
      burn: ['no burn', 'Does not burn'],
      micro: ['flat shard', 'Flat faces of equal thickness; conchoidal fracture'],
    },
  },
  {
    id: 'pyrex_glass', name: 'Borosilicate Glass (Pyrex)', formula: 'SiO₂·B₂O₃', category: 'glass',
    appearance: 'Colourless, slightly bluish, thicker walls',
    density: 2.23, hardness: 5.5, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['bluish thick shard', 'Colourless with a faint blue cast; noticeably thicker walls'],
      density: ['ρ 2.23', 'Density 2.23 g/cm³ — sinks in water but clearly lighter than the others'],
      burn: ['no burn', 'Does not burn; resists heat far longer than the others'],
      micro: ['thick shard', 'Thick shard, edges less sharply conchoidal'],
    },
  },

  // ─────────────────────────── SOILS ───────────────────────────
  {
    id: 'sandy_loam', name: 'Sandy Loam', formula: 'sand + silt + clay', category: 'soil',
    appearance: 'Light brown, gritty, grains visible to the hand lens',
    density: 1.60, magnetic: false, ph: 6.5, conductivity: 'weak',
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['light brown gritty', 'Light brown; gritty, individual grains visible under the hand lens'],
      water: ['partial', 'Sand settles immediately; a fine cloud of silt stays suspended'],
      ph: ['pH 6.5', 'pH ≈ 6.5 (slightly acidic)'],
      magnet: ['weak positive', 'A few dark grains are pulled out — magnetic iron present'],
    },
  },
  {
    id: 'clay_soil', name: 'Clay', formula: 'hydrous aluminium silicate', category: 'soil',
    appearance: 'Reddish-brown, smooth, plastic when wet',
    density: 1.80, magnetic: false, ph: 7.5, conductivity: 'weak',
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['reddish smooth', 'Reddish-brown; smooth and plastic, no visible grains'],
      water: ['partial', 'Clouds the water and stays suspended for a long time; very little settles'],
      ph: ['pH 7.5', 'pH ≈ 7.5 (slightly basic)'],
      magnet: ['negative', 'Nothing is pulled out by the magnet'],
    },
  },
  {
    id: 'potting_mix', name: 'Potting Mix', formula: 'compost + perlite + peat', category: 'soil',
    appearance: 'Dark, contains visible fibres and white perlite flecks',
    density: 1.10, magnetic: false, ph: 6.0, conductivity: 'weak',
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['dark with fibres and white flecks', 'Dark; visible plant fibres and white perlite flecks'],
      water: ['partial', 'Organic matter floats on top while mineral grains sink'],
      ph: ['pH 6.0', 'pH ≈ 6.0 (acidic)'],
      magnet: ['negative', 'Nothing is pulled out by the magnet'],
    },
  },

  // ─────────────────────────── PLASTICS ───────────────────────────
  {
    id: 'plastic_pe', name: 'Polyethylene (PE)', formula: '(C₂H₄)ₙ', category: 'plastic',
    appearance: 'Waxy translucent white, flexible',
    density: 0.94, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['waxy translucent flexible plastic', 'Waxy translucent white, flexible, bends without snapping'],
      density: ['ρ 0.94', 'Density 0.94 g/cm³ — floats in water'],
      burn: ['burns waxy candle smell', 'Burns with a blue flame and drips, smells like a wax candle'],
    },
  },
  {
    id: 'plastic_pp', name: 'Polypropylene (PP)', formula: '(C₃H₆)ₙ', category: 'plastic',
    appearance: 'Translucent, stiff but hingeable',
    density: 0.905, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['translucent stiff plastic', 'Translucent, stiff; bends then snaps back'],
      density: ['ρ 0.91', 'Density 0.91 g/cm³ — floats in water'],
      burn: ['burns waxy candle smell', 'Burns with a blue flame and drips, smells like a wax candle'],
    },
  },
  {
    id: 'plastic_pet', name: 'PET', formula: 'polyester', category: 'plastic',
    appearance: 'Clear, rigid, snaps rather than bends',
    density: 1.38, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['clear rigid plastic', 'Clear and rigid; snaps instead of bending'],
      density: ['ρ 1.38', 'Density 1.38 g/cm³ — sinks in water'],
      burn: ['burns sweet black smoke', 'Burns with a yellow smoky flame, smells sweetish, drips black'],
    },
  },
  {
    id: 'plastic_pvc', name: 'PVC', formula: '(C₂H₃Cl)ₙ', category: 'plastic',
    appearance: 'Grey or white, rigid',
    density: 1.38, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'partial' },
    results: {
      appearance: ['grey rigid plastic', 'Grey or white and rigid'],
      density: ['ρ 1.38', 'Density 1.38 g/cm³ — sinks in water'],
      burn: ['burns green flame acrid', 'Hard to ignite; burns with a green-tinged flame and a sharp acrid smell'],
    },
  },

  // ─────────────────────────── TABLETS / DRUGS ───────────────────────────
  {
    id: 'aspirin', name: 'Aspirin Tablet', formula: 'C₉H₈O₄', category: 'tablet',
    appearance: 'White round tablet, chalky',
    density: 1.40, magnetic: false, ph: 3.0, conductivity: 'weak',
    solubility: { water: 'partial', ethanol: 'soluble', acetone: 'partial' },
    results: {
      appearance: ['white round tablet', 'White round tablet with a score line, chalky'],
      iodine: ['negative', 'No change — iodine stays amber'],
      vinegar: ['negative', 'No reaction'],
      bicarb: ['effervesce', 'Fizzing — the acid reacts with bicarbonate'],
      h2o2: ['negative', 'No reaction'],
      ph: ['pH 3.0', 'pH ≈ 3.0 (acidic)'],
    },
  },
  {
    id: 'acetaminophen', name: 'Acetaminophen Tablet', formula: 'C₈H₉NO₂', category: 'tablet',
    appearance: 'White oval tablet, smooth',
    density: 1.45, magnetic: false, ph: 6.0, conductivity: 'none',
    solubility: { water: 'partial', ethanol: 'soluble', acetone: 'partial' },
    results: {
      appearance: ['white oval tablet', 'White oval tablet, smooth, no score line'],
      iodine: ['weak positive', 'Faint purple-brown colour develops'],
      vinegar: ['negative', 'No reaction'],
      bicarb: ['negative', 'No reaction'],
      h2o2: ['weak positive', 'Slow colour change to brown'],
      ph: ['pH 6.0', 'pH ≈ 6.0 (near neutral)'],
    },
  },
  {
    id: 'antacid', name: 'Antacid Tablet', formula: 'CaCO₃', category: 'tablet',
    appearance: 'Chalky white tablet, soft',
    density: 2.10, magnetic: false, ph: 9.0, conductivity: 'weak',
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['chalky soft tablet', 'Chalky white tablet, soft enough to scratch easily'],
      iodine: ['negative', 'No change — iodine stays amber'],
      vinegar: ['effervesce', 'Steady fizzing as CO₂ is released'],
      bicarb: ['negative', 'No reaction'],
      h2o2: ['negative', 'No reaction'],
      ph: ['pH 9.0', 'pH ≈ 9.0 (basic)'],
    },
  },
];

// Evidence-pattern samples: matched by inspection rather than by wet chemistry.
const PRINT_PATTERNS = [
  { id: 'loop',  name: 'Loop',  description: 'Ridges enter one side, curve back on themselves, and exit the same side. One core, one delta.' },
  { id: 'whorl', name: 'Whorl', description: 'Ridges form circles or spirals around a core, with two deltas.' },
  { id: 'arch',  name: 'Arch',  description: 'Ridges enter one side, rise to a peak in the middle, and exit the opposite side. No delta.' },
];

Object.assign(LAB, { MAT_SAMPLES: SAMPLES, PRINT_PATTERNS: PRINT_PATTERNS });
})(window.LAB);
