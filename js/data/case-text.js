(function (LAB) {
'use strict';

// Crime frames and suspect pools for the case generator.
//
// where: per category, where each unknown of that category was collected at the scene.
// clues: scene notes shown on the case file. They set the story and the time window;
// the lab work is still what separates the suspects.

const FIRST_NAMES = ['Ava','Ben','Carla','Derek','Elena','Farid','Grace','Hugo','Ines','Jamal','Kira','Lena','Marco','Nadia','Omar','Priya','Quinn','Rosa','Soren','Tomas','Uma','Victor','Wren','Yusuf','Zoe'];
const LAST_NAMES = ['Alvarez','Brennan','Chowdhury','Delgado','Ellis','Farrow','Gonzalez','Haddad','Ivanov','Jensen','Kowalski','Lindqvist','Moreau','Nakamura','Okafor','Petrov','Quintero','Rasmussen','Silva','Tanaka','Ustinov','Vasquez','Whitfield','Yamada','Zeller'];
const ROLES = ['the night janitor','the lab assistant','the head groundskeeper','the delivery driver','the club president','the archivist','the equipment manager','the student body reporter','the cafeteria cook','the art club treasurer'];

const CRIME_TYPES = [
  {
    id: 'powder_packet',
    title: 'The Unlabelled Packet',
    categories: ['white_powder', 'clear_liquid'],
    brief: 'A sealed packet of white powder was found wedged under {victim}’s workstation at {location}. Three people had access to the bench. The packet must be identified, and whoever left it must be placed at the bench by the tests you run.',
    questionHint: 'Identify the powder and the liquid found with it, then name who left the packet.',
    where: {
      white_powder: ['powder from inside the packet', 'powder spilled on the floor below the bench'],
      clear_liquid: ['a ring of liquid on the bench beside the packet', 'liquid soaked into a paper towel in the bin'],
    },
    clues: [
      'The packet was sealed with tape torn by hand, not cut with scissors.',
      'The custodian says the bench was wiped clean when the room was locked.',
    ],
  },
  {
    id: 'lab_vandalism',
    title: 'The Spoiled Samples',
    categories: ['clear_liquid', 'white_powder'],
    brief: 'Every prepared sample in {location} was ruined overnight by something poured into the stock bottles. {victim} found the trays in the morning. Work out what was poured, and who did it.',
    questionHint: 'Identify the liquid in the spill tray, then name who poured it.',
    where: {
      clear_liquid: ['liquid from the spill tray', 'liquid from the top of a stock bottle'],
      white_powder: ['residue scraped from the bottle neck', 'powder on the windowsill by the shelf'],
    },
    clues: [
      'The stock bottles were opened and closed again; two caps were swapped.',
      'A faint sharp smell was noticed when the trays were found, then faded.',
    ],
  },
  {
    id: 'forged_note',
    title: 'The Forged Note',
    categories: ['clear_liquid'],
    chromatography: true,
    brief: 'A threatening note written with a black marker was left on {victim}’s door at {location}. Each suspect owns a different marker. Separate the ink from the note and from each suspect’s pen, and match them by Rf value.',
    questionHint: 'Run chromatography on the note ink and on each suspect’s ink, then name who wrote the note.',
    where: {
      clear_liquid: ['liquid that smudged the corner of the note', 'drops on the floor below the door'],
    },
    clues: [
      'The note is written in block capitals, so handwriting cannot be compared.',
      'Each suspect handed over the marker they carry every day.',
    ],
  },
  {
    id: 'break_in',
    title: 'The Broken Case',
    categories: ['glass', 'metal'],
    brief: 'A display case at {location} was smashed and {victim}’s contents were taken. Glass fragments and a metal sliver were left on the floor. Identify both, then name who broke in.',
    questionHint: 'Identify the glass fragment and the metal sliver, then name who broke in.',
    where: {
      glass: ['a fragment from inside the display case', 'a fragment caught in the doormat'],
      metal: ['a sliver bent into the lock', 'filings below the hinge'],
    },
    clues: [
      'The display case glass was not the only glass broken that night.',
      'The lock was forced with a tool, not opened with a key.',
    ],
  },
  {
    id: 'fiber_transfer',
    title: 'The Fibre on the Handle',
    categories: ['fiber', 'hair'],
    brief: 'A single fibre and a single hair were caught on the handle of the locked door at {location}, where {victim} was locked out overnight. Identify both, then name who left them there.',
    questionHint: 'Identify the fibre by burn test and the hair by microscopy, then name who left them.',
    where: {
      fiber: ['a fibre snagged on the door handle', 'a fibre caught in the door frame'],
      hair: ['a hair stuck to the handle', 'a hair on the floor by the door'],
    },
    clues: [
      'The handle had been wiped, but the snag on its underside was missed.',
      'Whoever locked the door was close enough to brush against it.',
    ],
  },
  {
    id: 'soil_trace',
    title: 'The Mud on the Floor',
    categories: ['soil', 'fiber'],
    brief: 'Wet soil was tracked across {location} the night {victim}’s supplies went missing. A soil sample was lifted from the floor and a fibre from the torn bag. Identify both, then name who tracked it in.',
    questionHint: 'Identify the soil and the fibre, then name who tracked it in.',
    where: {
      soil: ['a boot print by the door', 'mud on the bottom stair'],
      fiber: ['a fibre from the torn supply bag', 'a fibre on the window latch'],
    },
    clues: [
      'It rained from 6 pm, so the soil was carried in after that.',
      'Only one set of muddy prints crosses the room.',
    ],
  },
  {
    id: 'tampered_med',
    title: 'The Swapped Tablets',
    categories: ['tablet', 'clear_liquid'],
    brief: '{victim}’s medication tablets were swapped in the {location} cabinet. Two tablets from the cabinet and one liquid used to coat them must be identified before the substitution can be pinned on someone.',
    questionHint: 'Identify both tablets and the coating liquid, then name who swapped them.',
    where: {
      tablet: ['a tablet from the labelled bottle', 'a tablet found loose on the cabinet shelf'],
      clear_liquid: ['liquid beaded on the tablets', 'a wet patch inside the cabinet door'],
    },
    clues: [
      'The bottle label was peeled back and pressed down again.',
      'The swapped tablets look almost the same as the real ones.',
    ],
  },
  {
    id: 'spiked_punch',
    title: 'The Spiked Punch',
    categories: ['clear_liquid', 'white_powder'],
    brief: 'The punch bowl at the {location} awards night tasted wrong, and {victim} was the first to notice. Something was stirred in while the bowl stood unattended. Identify what was added, then name who added it.',
    questionHint: 'Identify the liquid and the powder taken from the punch table, then name who spiked it.',
    where: {
      clear_liquid: ['liquid from a cup left beside the bowl', 'liquid from a small bottle in the bin'],
      white_powder: ['undissolved powder at the bottom of the bowl', 'powder spilled on the tablecloth'],
    },
    clues: [
      'The bowl was left unattended for about ten minutes during the speeches.',
      'A torn sachet corner was found under the table.',
    ],
  },
  {
    id: 'missing_trophy',
    title: 'The Missing Trophy',
    categories: ['metal', 'fiber'],
    brief: 'The state trophy vanished from its shelf in {location}. {victim} found the bracket unscrewed and a cloth left behind. Identify the metal scraped from the bracket and the fibre from the cloth, then name the thief.',
    questionHint: 'Identify the metal and the fibre, then name who took the trophy.',
    where: {
      metal: ['metal scraped off the bracket screws', 'a shaving on the shelf'],
      fiber: ['a fibre from the cloth left on the shelf', 'a fibre caught on the bracket'],
    },
    clues: [
      'The bracket screws were turned with a tool brought from outside.',
      'The trophy weighs over 4 kg, so the thief carried it by hand.',
    ],
  },
  {
    id: 'counterfeit_pills',
    title: 'The Counterfeit Pills',
    categories: ['tablet', 'white_powder'],
    brief: 'Fake vitamin tablets were sold at the {location} bake sale, and {victim} traced them back to one table. Identify the tablets and the powder used to press them, then name who made them.',
    questionHint: 'Identify the tablets and the binding powder, then name who pressed them.',
    where: {
      tablet: ['a tablet from a sold bag', 'a tablet from the cash box'],
      white_powder: ['powder dusted on the bag', 'powder from the bottom of the sales bin'],
    },
    clues: [
      'The tablets crumble at the edges as if pressed by hand.',
      'Three suspects ran a table at the sale; a fourth helped set up.',
    ],
  },
  {
    id: 'greenhouse',
    title: 'The Trampled Greenhouse',
    categories: ['soil', 'hair'],
    brief: 'The science club greenhouse at {location} was trampled the night before judging, and {victim}’s entry was destroyed. Soil and an animal hair were left on the door. Identify both, then name who broke in.',
    questionHint: 'Identify the soil and the hair, then name who trampled the greenhouse.',
    where: {
      soil: ['soil from a footprint on the door step', 'soil smeared on the latch'],
      hair: ['a hair caught on the door hinge', 'a hair on the potting bench'],
    },
    clues: [
      'The greenhouse is filled with potting mix, but not every footprint matches it.',
      'Someone brought an animal with them, or carried its hair on their clothes.',
    ],
  },
  {
    id: 'recycling_fire',
    title: 'The Recycling Bin Fire',
    categories: ['plastic', 'glass'],
    brief: 'A recycling bin behind {location} was set alight, and {victim} put it out. Melted plastic and a glass shard were recovered from the ash. Identify both, then name who started the fire.',
    questionHint: 'Identify the plastic and the glass, then name who started the fire.',
    where: {
      plastic: ['plastic melted onto the bin rim', 'plastic from the unburnt layer'],
      glass: ['a shard from the bottom of the bin', 'a shard beside the bin'],
    },
    clues: [
      'The fire started from the top of the bin, not from below.',
      'The bin had been emptied that morning, so everything in it was new.',
    ],
  },
];

// Where a suspect's matching item was found, per evidence category.
const PLACES = {
  white_powder: ['locker', 'backpack', 'desk drawer', 'coat pocket'],
  clear_liquid: ['water bottle', 'gym bag', 'desk drawer', 'car cup holder'],
  metal: ['toolbox', 'workshop bench', 'keychain', 'backpack'],
  glass: ['car floor mat', 'workshop', 'jacket cuff', 'shoe treads'],
  fiber: ['jacket', 'scarf', 'sweater', 'gloves'],
  hair: ['coat', 'car seat', 'scarf', 'backpack'],
  soil: ['boot treads', 'garden at home', 'car floor mat', 'bike tyres'],
  plastic: ['backpack', 'lunch bag', 'locker', 'recycling bin at home'],
  tablet: ['pill organiser', 'backpack', 'desk drawer', 'first-aid kit'],
};

const VICTIMS = ['the chemistry teacher','the room monitor','the event supervisor','the team captain','the custodian','the club advisor'];
const LOCATIONS = ['Room 214','the science wing storage room','the competition prep lab','the equipment shed','the second-floor hallway','the locker bay by the gym'];
const TIMES_LOCKED = ['5:45 pm', '6:10 pm', '6:30 pm', '7:05 pm'];
const TIMES_FOUND = ['7:20 am', '7:45 am', '8:05 am', '9:10 pm'];

// Verified alibis are backed by a record; unverified ones are only the suspect's word.
// The culprit always draws an unverified one, and so does at least one innocent
// suspect, so the alibis narrow the field without solving the case.
const ALIBIS_VERIFIED = [
  'has a timestamped bus pass for the time of the incident',
  'was signed into a practice that ended at the time of the incident',
  'was seen in the hallway by two other students',
  'was off campus all afternoon with a documented appointment',
  'was in the front office signing out equipment at the time of the incident',
];
const ALIBIS_UNVERIFIED = [
  'says they were in the library until the building closed',
  'has no alibi and admits they were looking for a quiet place to study',
  'says they left before the incident but no one saw them go',
  'says they were home alone',
];
const ALIBIS = [...ALIBIS_VERIFIED, ...ALIBIS_UNVERIFIED];

const MOTIVES = [
  'was passed over for the role they wanted',
  'had a public argument with the victim that week',
  'owed money to the victim',
  'had been accused of cheating by the victim',
  'had sole access to the storage key that week',
  'was in charge of the supplies that went missing',
];

Object.assign(LAB, { FIRST_NAMES: FIRST_NAMES, LAST_NAMES: LAST_NAMES, ROLES: ROLES, CRIME_TYPES: CRIME_TYPES, PLACES: PLACES, VICTIMS: VICTIMS, LOCATIONS: LOCATIONS, TIMES_LOCKED: TIMES_LOCKED, TIMES_FOUND: TIMES_FOUND, ALIBIS: ALIBIS, ALIBIS_VERIFIED: ALIBIS_VERIFIED, ALIBIS_UNVERIFIED: ALIBIS_UNVERIFIED, MOTIVES: MOTIVES });
})(window.LAB);
