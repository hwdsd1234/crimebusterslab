(function (LAB) {
'use strict';

// Reagents available in the kit and the tests the bench can run. Only the core
// Crime Busters tests are offered: look, water, vinegar, iodine, pH, conductivity,
// density, burn, microscope (plus chromatography, which has its own station).

const REAGENTS = {
  water:   { id: 'water',   name: 'Distilled Water',          color: '#cfe6f5' },
  vinegar: { id: 'vinegar', name: 'Vinegar (dilute acetic acid)', color: '#f2ead0' },
  iodine:  { id: 'iodine',  name: 'Iodine Solution',          color: '#b8860b' },
};

const TESTS = [
  { id: 'appearance',   label: 'Appearance',      short: 'Look',   device: 'hand_lens' },
  { id: 'water',        label: 'Water',           short: 'H₂O',    device: 'spot_plate' },
  { id: 'vinegar',      label: 'Vinegar',         short: 'HOAc',   device: 'spot_plate' },
  { id: 'iodine',       label: 'Iodine',          short: 'I₂',     device: 'spot_plate' },
  { id: 'ph',           label: 'pH',              short: 'pH',     device: 'ph' },
  { id: 'conductivity', label: 'Conductivity',    short: 'Cond',   device: 'conductivity' },
  { id: 'density',      label: 'Density',         short: 'ρ',      device: 'density' },
  { id: 'burn',         label: 'Burn test',       short: 'Burn',   device: 'burn' },
  { id: 'micro',        label: 'Microscope',      short: 'Micro',  device: 'microscope' },
];

const SOLUBILITY_TEXT = {
  soluble:   'Dissolves completely into a clear solution',
  partial:   'Only partly dissolves; a cloudy suspension is left',
  insoluble: 'Does not dissolve; settles at the bottom unchanged',
  reacts:    'Reacts as it dissolves — gas is given off',
  miscible:  'Mixes in all proportions, no separation',
  dissolves: 'Dissolves, softening the sample',
};

const CONDUCTIVITY_TEXT = {
  none:   'No deflection — no ions present (non-electrolyte)',
  weak:   'Dim deflection — few ions (weak electrolyte)',
  strong: 'Full deflection — many ions (strong electrolyte)',
};

// results entries are [token, observationText]; model.js normalises them.
const SAMPLES = [

  // ─────────────────────────── WHITE POWDERS ───────────────────────────
  {
    id: 'table_salt', name: 'Table Salt', formula: 'NaCl', category: 'white_powder',
    appearance: 'White translucent cubes, sharp edges, glassy luster',
    density: 2.17, hardness: 2.5, magnetic: false, ph: 7.0, conductivity: 'strong',
    solubility: { water: 'soluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white cubic crystals', 'White translucent cubes, sharp edges, glassy luster'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction, powder simply dissolves'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn; grains pop and spatter'],
    },
  },
  {
    id: 'sugar', name: 'Table Sugar', formula: 'C₁₂H₂₂O₁₁', category: 'white_powder',
    appearance: 'White monocrystal granules, flat plates, glassy',
    density: 1.59, hardness: 2.5, magnetic: false, ph: 7.0, conductivity: 'none',
    solubility: { water: 'soluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white flat plates', 'White flat plate crystals, glassy luster'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['caramelizes', 'Melts, browns and caramelizes; smells sweet'],
    },
  },
  {
    id: 'baking_soda', name: 'Baking Soda', formula: 'NaHCO₃', category: 'white_powder',
    appearance: 'White fine powder, dull, no visible crystal faces',
    density: 2.20, hardness: 2.5, magnetic: false, ph: 8.3, conductivity: 'strong',
    solubility: { water: 'soluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white fine powder', 'White fine powder, dull, no visible crystal faces'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['effervesce', 'Vigorous bubbling as CO₂ is released'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn; turns to a grey residue'],
    },
  },
  {
    id: 'washing_soda', name: 'Washing Soda', formula: 'Na₂CO₃', category: 'white_powder',
    appearance: 'White granular powder, slightly chalky',
    density: 2.53, hardness: 2.7, magnetic: false, ph: 11.5, conductivity: 'strong',
    solubility: { water: 'soluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white chalky granules', 'White granular powder, slightly chalky'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['effervesce', 'Vigorous bubbling as CO₂ is released'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn'],
    },
  },
  {
    id: 'cornstarch', name: 'Cornstarch', formula: '(C₆H₁₀O₅)ₙ', category: 'white_powder',
    appearance: 'Bright white, extremely fine, clumps when pressed',
    density: 1.50, hardness: 1.5, magnetic: false, ph: 6.5, conductivity: 'none',
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['bright white fine powder', 'Bright white, extremely fine, clumps when pressed'],
      iodine:     ['starch positive', 'Instant deep blue-black colour — starch present'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Chars black, does not flame'],
    },
  },
  {
    id: 'flour', name: 'All-Purpose Flour', formula: 'starch + protein', category: 'white_powder',
    appearance: 'Off-white, soft, slightly clumpy',
    density: 1.40, hardness: 1.5, magnetic: false, ph: 6.0, conductivity: 'weak',
    solubility: { water: 'partial', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['off-white soft powder', 'Off-white, soft, slightly clumpy'],
      iodine:     ['starch positive', 'Blue-black colour, duller than pure starch'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Chars black, does not flame'],
    },
  },
  {
    id: 'citric_acid', name: 'Citric Acid', formula: 'C₆H₈O₇', category: 'white_powder',
    appearance: 'Colourless to white monoclinic crystals',
    density: 1.66, hardness: 2.0, magnetic: false, ph: 2.2, conductivity: 'strong',
    solubility: { water: 'soluble', ethanol: 'partial', acetone: 'insoluble' },
    results: {
      appearance: ['colourless crystals', 'Colourless to white crystals, sharp'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction (both are acids)'],
      bicarb:     ['effervesce', 'Vigorous bubbling — acid + bicarbonate gives CO₂'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Melts and gives off acrid fumes'],
    },
  },
  {
    id: 'epsom_salt', name: 'Epsom Salt', formula: 'MgSO₄·7H₂O', category: 'white_powder',
    appearance: 'Colourless needle-like crystals',
    density: 1.68, hardness: 2.0, magnetic: false, ph: 6.0, conductivity: 'strong',
    solubility: { water: 'soluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['colourless needles', 'Colourless needle-like crystals'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['weak positive', 'Faint, slow fizzing'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn; whitens and cracks'],
    },
  },
  {
    id: 'calcium_carbonate', name: 'Calcium Carbonate', formula: 'CaCO₃', category: 'white_powder',
    appearance: 'White opaque powder, earthy',
    density: 2.71, hardness: 3.0, magnetic: false, ph: 9.0, conductivity: 'weak',
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white opaque powder', 'White opaque powder, earthy'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['effervesce', 'Slow steady fizzing as CO₂ is released'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn'],
    },
  },
  {
    id: 'talcum', name: 'Talcum Powder', formula: 'Mg₃Si₄O₁₀(OH)₂', category: 'white_powder',
    appearance: 'White, greasy to the touch, very soft',
    density: 2.75, hardness: 1.0, magnetic: false, ph: 8.0, conductivity: 'none',
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white greasy powder', 'White, greasy feel, very soft'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction — this rules out a carbonate'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn'],
    },
  },
  {
    id: 'borax', name: 'Borax', formula: 'Na₂B₄O₇·10H₂O', category: 'white_powder',
    appearance: 'Colourless to white prismatic crystals',
    density: 1.73, hardness: 2.5, magnetic: false, ph: 9.2, conductivity: 'strong',
    solubility: { water: 'soluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white prismatic crystals', 'Colourless to white prismatic crystals'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn; swells and whitens'],
    },
  },
  {
    id: 'cream_of_tartar', name: 'Cream of Tartar', formula: 'KC₄H₅O₆', category: 'white_powder',
    appearance: 'Off-white fine powder, gritty',
    density: 1.79, hardness: 2.5, magnetic: false, ph: 3.5, conductivity: 'strong',
    solubility: { water: 'partial', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['off-white gritty powder', 'Off-white fine powder, gritty'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['effervesce', 'Steady fizzing — acid + bicarbonate gives CO₂'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Chars and gives acrid fumes'],
    },
  },
  {
    id: 'gypsum', name: 'Gypsum (Plaster)', formula: 'CaSO₄·2H₂O', category: 'white_powder',
    appearance: 'White soft powder, satiny sheen',
    density: 2.31, hardness: 2.0, magnetic: false, ph: 7.5, conductivity: 'weak',
    solubility: { water: 'partial', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['white satiny powder', 'White soft powder, satiny sheen'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction — this rules out a carbonate'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn'],
    },
  },

  // ─────────────────────────── CLEAR LIQUIDS ───────────────────────────
  {
    id: 'water', name: 'Water', formula: 'H₂O', category: 'clear_liquid',
    appearance: 'Colourless, odourless, no residue when evaporated',
    density: 1.00, magnetic: false, ph: 7.0, conductivity: 'none',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: {
      appearance: ['colourless odourless', 'Colourless, odourless, leaves no residue'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn'],
    },
  },
  {
    id: 'vinegar', name: 'Vinegar', formula: 'CH₃COOH (aq)', category: 'clear_liquid',
    appearance: 'Colourless, sharp pungent smell',
    density: 1.01, magnetic: false, ph: 2.5, conductivity: 'strong',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: {
      appearance: ['colourless sharp smell', 'Colourless with a sharp pungent smell'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['effervesce', 'Vigorous bubbling — acid + bicarbonate gives CO₂'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn'],
    },
  },
  {
    id: 'hydrogen_peroxide', name: 'Hydrogen Peroxide', formula: 'H₂O₂', category: 'clear_liquid',
    appearance: 'Colourless, faintly sharp, slightly oily feel',
    density: 1.05, magnetic: false, ph: 5.5, conductivity: 'none',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: {
      appearance: ['colourless faintly sharp', 'Colourless, faintly sharp smell'],
      iodine:     ['bleaches', 'The iodine colour disappears — sample is an oxidiser'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn; gives off oxygen gas when heated'],
    },
  },
  {
    id: 'rubbing_alcohol', name: 'Rubbing Alcohol', formula: 'C₃H₈O', category: 'clear_liquid',
    appearance: 'Colourless, strong alcohol smell, evaporates fast',
    density: 0.79, magnetic: false, ph: 6.5, conductivity: 'none',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: {
      appearance: ['colourless alcohol smell', 'Colourless, strong alcohol smell, evaporates quickly'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['flammable', 'Burns with a pale blue flame and gives off heat'],
    },
  },
  {
    id: 'salt_water', name: 'Salt Water', formula: 'NaCl (aq)', category: 'clear_liquid',
    appearance: 'Colourless, leaves white residue when evaporated',
    density: 1.03, magnetic: false, ph: 7.0, conductivity: 'strong',
    solubility: { water: 'miscible', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['colourless leaves white residue', 'Colourless, leaves a white residue when evaporated'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn; spatters and leaves white solid'],
    },
  },
  {
    id: 'sugar_water', name: 'Sugar Water', formula: 'sucrose (aq)', category: 'clear_liquid',
    appearance: 'Colourless, slightly viscous, sweet smell',
    density: 1.06, magnetic: false, ph: 7.0, conductivity: 'none',
    solubility: { water: 'miscible', ethanol: 'partial', acetone: 'insoluble' },
    results: {
      appearance: ['colourless viscous', 'Colourless, slightly viscous'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['caramelizes', 'Does not burn; browns and caramelizes to a residue'],
    },
  },
  {
    id: 'bleach', name: 'Bleach Solution', formula: 'NaClO (aq)', category: 'clear_liquid',
    appearance: 'Pale yellow, strong chemical smell',
    density: 1.08, magnetic: false, ph: 11.5, conductivity: 'strong',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: {
      appearance: ['pale yellow chemical smell', 'Pale yellow with a strong chemical smell'],
      iodine:     ['bleaches', 'The iodine colour disappears — sample is an oxidiser'],
      vinegar:    ['weak positive', 'Faint fizzing; a sharp chlorine-type smell develops'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['effervesce', 'Rapid fizzing — oxygen gas is released'],
      burn:       ['no burn', 'Does not burn'],
    },
  },
  {
    id: 'ammonia', name: 'Ammonia Solution', formula: 'NH₃ (aq)', category: 'clear_liquid',
    appearance: 'Colourless, strong pungent smell',
    density: 0.99, magnetic: false, ph: 11.5, conductivity: 'strong',
    solubility: { water: 'miscible', ethanol: 'miscible', acetone: 'miscible' },
    results: {
      appearance: ['colourless pungent smell', 'Colourless with a strong pungent smell'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No visible reaction (acid is neutralised)'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['no burn', 'Does not burn'],
    },
  },
  {
    id: 'milk', name: 'Milk', formula: 'emulsion', category: 'clear_liquid',
    appearance: 'Opaque white',
    density: 1.03, magnetic: false, ph: 6.6, conductivity: 'weak',
    solubility: { water: 'miscible', ethanol: 'reacts', acetone: 'reacts' },
    results: {
      appearance: ['opaque white', 'Opaque white liquid'],
      iodine:     ['weak positive', 'Dull brownish-purple, much weaker than pure starch'],
      vinegar:    ['precipitate', 'Curdles — a white solid precipitates out'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['weak positive', 'Slow fizzing'],
      burn:       ['no burn', 'Does not burn; scorches brown'],
    },
  },
  {
    id: 'corn_oil', name: 'Corn Oil', formula: 'triglyceride', category: 'clear_liquid',
    appearance: 'Pale yellow, oily, viscous',
    density: 0.92, magnetic: false, ph: 7.0, conductivity: 'none',
    solubility: { water: 'insoluble', ethanol: 'dissolves', acetone: 'dissolves' },
    results: {
      appearance: ['pale yellow oily', 'Pale yellow, oily and viscous'],
      iodine:     ['negative', 'No change — iodine stays amber'],
      vinegar:    ['negative', 'No reaction; two layers form'],
      bicarb:     ['negative', 'No reaction'],
      h2o2:       ['negative', 'No reaction'],
      burn:       ['flammable', 'Burns with a yellow smoky flame'],
    },
  },

  // ─────────────────────────── METALS ───────────────────────────
  {
    id: 'aluminum', name: 'Aluminium', formula: 'Al', category: 'metal',
    appearance: 'Silvery grey, very light, dull grey tarnish',
    density: 2.70, hardness: 2.75, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['silvery grey light metal', 'Silvery grey, very light, dull grey tarnish'],
      vinegar:    ['negative', 'No visible reaction'],
      magnet:     ['non-magnetic', 'Not attracted to the magnet'],
      burn:       ['no burn', 'Does not burn as a foil or fragment'],
    },
  },
  {
    id: 'copper', name: 'Copper', formula: 'Cu', category: 'metal',
    appearance: 'Reddish-orange, bright when freshly cut',
    density: 8.96, hardness: 3.0, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['reddish orange metal', 'Reddish-orange metal, bright when freshly cut'],
      vinegar:    ['weak positive', 'Surface slowly turns green over time'],
      magnet:     ['non-magnetic', 'Not attracted to the magnet'],
      burn:       ['no burn', 'Does not burn; surface blackens'],
    },
  },
  {
    id: 'iron', name: 'Iron', formula: 'Fe', category: 'metal',
    appearance: 'Dark grey, dense, often with rust',
    density: 7.87, hardness: 4.5, magnetic: true,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['dark grey with rust', 'Dark grey, dense, often with orange rust'],
      vinegar:    ['weak positive', 'Slow fizzing and rust staining'],
      magnet:     ['magnetic', 'Strongly attracted to the magnet'],
      burn:       ['no burn', 'Does not burn; glows red in a flame'],
    },
  },
  {
    id: 'zinc', name: 'Zinc', formula: 'Zn', category: 'metal',
    appearance: 'Bluish-white, dull, heavy for its size',
    density: 7.14, hardness: 2.5, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['bluish white metal', 'Bluish-white, dull surface'],
      vinegar:    ['effervesce', 'Steady bubbling of hydrogen gas'],
      magnet:     ['non-magnetic', 'Not attracted to the magnet'],
      burn:       ['no burn', 'Does not burn; burns only as powder with blue-green flame'],
    },
  },
  {
    id: 'magnesium', name: 'Magnesium', formula: 'Mg', category: 'metal',
    appearance: 'Silvery white, extremely light, darkens on standing',
    density: 1.74, hardness: 2.5, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['silvery white very light metal', 'Silvery white, extremely light'],
      vinegar:    ['effervesce', 'Brisk bubbling of hydrogen gas'],
      magnet:     ['non-magnetic', 'Not attracted to the magnet'],
      burn:       ['burns brilliant white', 'Burns with a dazzling white flame'],
    },
  },
];

Object.assign(LAB, { REAGENTS: REAGENTS, TESTS: TESTS, SOLUBILITY_TEXT: SOLUBILITY_TEXT, CONDUCTIVITY_TEXT: CONDUCTIVITY_TEXT, CHEM_SAMPLES: SAMPLES });
})(window.LAB);
