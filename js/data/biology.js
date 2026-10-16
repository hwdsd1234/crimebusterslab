(function (LAB) {
'use strict';

// Fibers and hair — identified by burn test, solvent behaviour, and microscopy.

const SAMPLES = [

  // ─────────────────────────── FIBERS ───────────────────────────
  {
    id: 'cotton', name: 'Cotton', formula: 'cellulose', category: 'fiber', origin: 'plant',
    appearance: 'Off-white, irregular flat ribbon with twisted edges',
    density: 1.52, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['irregular twisted ribbon', 'Off-white irregular ribbon, twisted lengthwise, no scales'],
      burn: ['burns fast paper smell', 'Ignites quickly, burns with a yellow flame, smells like burning paper, leaves fine grey ash'],
      acetone: ['insoluble', 'Unchanged after 2 minutes in acetone'],
      micro: ['plant ribbon', 'Irregular flattened ribbon with twisted edges; no scales, no uniform diameter'],
    },
    burnData: { speed: 'fast', odor: 'burning paper', residue: 'fine grey ash, no bead', selfExt: false },
  },
  {
    id: 'wool', name: 'Wool', formula: 'keratin', category: 'fiber', origin: 'animal',
    appearance: 'Cream, scaly surface, slight crimp',
    density: 1.30, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['scaly crimped animal fiber', 'Cream fibre with a scaly surface and natural crimp'],
      burn: ['burns hair smell self-extinguishing', 'Burns slowly and self-extinguishes, smells like burnt hair or feathers, leaves a brittle black bead'],
      acetone: ['insoluble', 'Unchanged after 2 minutes in acetone'],
      micro: ['scaly animal fiber', 'Round fibre covered in overlapping scales with a distinct cortex and medulla'],
    },
    burnData: { speed: 'slow', odor: 'burnt hair / feathers', residue: 'brittle black bead, crushes easily', selfExt: true },
  },
  {
    id: 'silk', name: 'Silk', formula: 'fibroin', category: 'fiber', origin: 'animal',
    appearance: 'Lustrous, smooth, uniform round thread',
    density: 1.35, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['smooth lustrous uniform thread', 'Lustrous, smooth, very uniform round thread'],
      burn: ['burns hair smell hard bead', 'Burns slowly, smells like burnt hair, leaves a hard dark bead that does not crush'],
      acetone: ['insoluble', 'Unchanged after 2 minutes in acetone'],
      micro: ['smooth uniform thread', 'Smooth fibre with no scales and a thin shadowy outline; perfectly uniform width'],
    },
    burnData: { speed: 'slow', odor: 'burnt hair', residue: 'hard shiny dark bead, will not crush', selfExt: true },
  },
  {
    id: 'nylon', name: 'Nylon', formula: 'polyamide', category: 'fiber', origin: 'synthetic',
    appearance: 'Clear to off-white, perfectly smooth and uniform',
    density: 1.14, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['smooth uniform synthetic thread', 'Perfectly smooth, uniform, translucent thread'],
      burn: ['melts drips celery smell', 'Melts and shrinks from the flame, drips, smells faintly like celery, leaves a hard tan bead'],
      acetone: ['insoluble', 'Unchanged after 2 minutes in acetone'],
      micro: ['smooth uniform synthetic', 'Perfectly smooth fibre of constant diameter with no surface markings'],
    },
    burnData: { speed: 'melts', odor: 'celery-like', residue: 'hard tan glossy bead', selfExt: false },
  },
  {
    id: 'polyester', name: 'Polyester', formula: 'PET', category: 'fiber', origin: 'synthetic',
    appearance: 'Bright white, smooth, often pilled',
    density: 1.38, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'insoluble' },
    results: {
      appearance: ['smooth bright synthetic', 'Bright white smooth fibre, constant diameter'],
      burn: ['melts black smoke sweet smell', 'Melts with sputtering and black smoke, smells sweetish, leaves a hard black bead'],
      acetone: ['insoluble', 'Unchanged after 2 minutes in acetone'],
      micro: ['smooth uniform synthetic', 'Smooth fibre of constant diameter; may show circular cross-section'],
    },
    burnData: { speed: 'melts', odor: 'sweetish, black smoke', residue: 'hard black bead', selfExt: false },
  },
  {
    id: 'acrylic', name: 'Acrylic', formula: 'polyacrylonitrile', category: 'fiber', origin: 'synthetic',
    appearance: 'White, soft, slightly fuzzy',
    density: 1.17, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'dissolves' },
    results: {
      appearance: ['soft fuzzy synthetic', 'Soft, slightly fuzzy white fibre'],
      burn: ['melts fast acrid smell', 'Melts very fast, smells acrid and fishy, leaves a hard brittle black bead'],
      acetone: ['dissolves', 'Softens and dissolves in acetone within a minute'],
      micro: ['smooth uniform synthetic', 'Smooth fibre of constant diameter, sometimes with speckles'],
    },
    burnData: { speed: 'melts fast', odor: 'acrid / fishy', residue: 'hard brittle black bead', selfExt: false },
  },
  {
    id: 'rayon', name: 'Rayon (Acetate)', formula: 'regenerated cellulose', category: 'fiber', origin: 'semi-synthetic',
    appearance: 'Bright, smooth, looks like silk',
    density: 1.32, magnetic: false,
    solubility: { water: 'insoluble', ethanol: 'insoluble', acetone: 'dissolves' },
    results: {
      appearance: ['smooth silk-like synthetic', 'Bright smooth thread, silk-like, serrated edges'],
      burn: ['burns fast paper smell melts edge', 'Burns quickly like paper but the edges melt, smells like burning paper, leaves a dark brittle residue'],
      acetone: ['dissolves', 'Dissolves in acetone'],
      micro: ['serrated synthetic', 'Smooth fibre with fine serrations along the edges'],
    },
    burnData: { speed: 'fast', odor: 'burning paper with melted edges', residue: 'dark brittle residue', selfExt: false },
  },

  // ─────────────────────────── HAIR ───────────────────────────
  // medullaIndex = medulla width / hair diameter — the measurement students make.
  {
    id: 'human_hair', name: 'Human Hair', formula: 'keratin', category: 'hair',
    appearance: 'Uniform shaft with fine scales',
    magnetic: false,
    results: {
      appearance: ['uniform shaft fine scales', 'Uniform shaft, diameter consistent along its length'],
      micro: ['human hair', 'Thin continuous medulla, even pigment distribution, fine close-fitting cuticle scales'],
      burn: ['burns hair smell', 'Burns slowly, smells like burnt hair, self-extinguishes, leaves a brittle black bead'],
    },
    microData: { diameterUm: 85, medullaUm: 24, medullaIndex: 0.28, pigment: 'even to dense, uniform along shaft', cuticle: 'fine, close-fitting, regular scales', scalePattern: 'petal/ripples' },
  },
  {
    id: 'cat_hair', name: 'Cat Hair', formula: 'keratin', category: 'hair',
    appearance: 'Shaft with a wide broken medulla',
    magnetic: false,
    results: {
      appearance: ['shaft with wide medulla', 'Shaft with a very wide central medulla, diameter varies along the length'],
      micro: ['cat hair', 'Wide fragmented medulla taking up much of the shaft, uneven clumped pigment, petal-shaped scales'],
      burn: ['burns hair smell', 'Burns slowly, smells like burnt hair, self-extinguishes'],
    },
    microData: { diameterUm: 95, medullaUm: 55, medullaIndex: 0.58, pigment: 'uneven, in clumps', cuticle: 'petal-shaped scales', scalePattern: 'petal' },
  },
  {
    id: 'dog_hair', name: 'Dog Hair', formula: 'keratin', category: 'hair',
    appearance: 'Thick shaft, often two medullae',
    magnetic: false,
    results: {
      appearance: ['thick shaft dense medulla', 'Thick shaft with a dense, often segmented medulla'],
      micro: ['dog hair', 'Very dense continuous medulla, sometimes split into two; chain-like scales'],
      burn: ['burns hair smell', 'Burns slowly, smells like burnt hair, self-extinguishes'],
    },
    microData: { diameterUm: 110, medullaUm: 68, medullaIndex: 0.62, pigment: 'dense, patchy', cuticle: 'chain-like scales', scalePattern: 'chain' },
  },
  {
    id: 'rabbit_hair', name: 'Rabbit Hair', formula: 'keratin', category: 'hair',
    appearance: 'Very wide shaft with a broad ladder-like medulla',
    magnetic: false,
    results: {
      appearance: ['wide shaft ladder medulla', 'Wide shaft with a broad ladder-like medulla and sparse pigment'],
      micro: ['rabbit hair', 'Broad continuous ladder-like medulla, pigment sparse and concentrated in patches'],
      burn: ['burns hair smell', 'Burns slowly, smells like burnt hair, self-extinguishes'],
    },
    microData: { diameterUm: 130, medullaUm: 78, medullaIndex: 0.60, pigment: 'sparse, in patches', cuticle: 'smooth, widely spaced scales', scalePattern: 'ripples' },
  },
];

Object.assign(LAB, { BIO_SAMPLES: SAMPLES });
})(window.LAB);
