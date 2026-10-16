(function (LAB) {
'use strict';

// Crime frames and suspect pools for the case generator.

const FIRST_NAMES = ['Ava','Ben','Carla','Derek','Elena','Farid','Grace','Hugo','Ines','Jamal','Kira','Lena','Marco','Nadia','Omar','Priya','Quinn','Rosa','Soren','Tomas','Uma','Victor','Wren','Yusuf','Zoe'];
const LAST_NAMES = ['Alvarez','Brennan','Chowdhury','Delgado','Ellis','Farrow','Gonzalez','Haddad','Ivanov','Jensen','Kowalski','Lindqvist','Moreau','Nakamura','Okafor','Petrov','Quintero','Rasmussen','Silva','Tanaka','Ustinov','Vasquez','Whitfield','Yamada','Zeller'];
const ROLES = ['the night janitor','the lab assistant','the head groundskeeper','the delivery driver','the club president','the archivist','the equipment manager','the student body reporter','the cafeteria cook','the art club treasurer'];

const CRIME_TYPES = [
  {
    id: 'powder_packet',
    title: 'The Unlabelled Packet',
    categories: ['white_powder', 'clear_liquid'],
    brief: 'A sealed packet of white powder was found wedged under {victim}’s workstation at {location}. Three people had access to the bench. The packet must be identified, and whoever left it must be placed at the bench by the tests you run.',
    evidenceKinds: ['unknown', 'unknown', 'trace'],
    questionHint: 'Identify the powder and the liquid found with it, then name who left the packet.',
  },
  {
    id: 'lab_vandalism',
    title: 'The Spoiled Samples',
    categories: ['clear_liquid', 'white_powder'],
    brief: 'Every prepared sample in {location} was ruined overnight by something poured into the stock bottles. {victim} found the trays in the morning. Work out what was poured, and who did it.',
    evidenceKinds: ['unknown', 'unknown', 'trace'],
    questionHint: 'Identify the liquid in the spill tray, then name who poured it.',
  },
  {
    id: 'forged_note',
    title: 'The Forged Note',
    categories: ['clear_liquid'],
    chromatography: true,
    brief: 'A threatening note written with a black marker was left on {victim}’s door at {location}. Each suspect owns a different marker. Separate the ink from the note and from each suspect’s pen, and match them by Rf value.',
    evidenceKinds: ['ink', 'ink', 'ink', 'trace'],
    questionHint: 'Run chromatography on the note ink and on each suspect’s ink, then name who wrote the note.',
  },
  {
    id: 'break_in',
    title: 'The Broken Case',
    categories: ['glass', 'metal'],
    brief: 'A display case at {location} was smashed and {victim}’s contents were taken. Glass fragments and a metal sliver were left on the floor. Identify both, then name who broke in.',
    evidenceKinds: ['unknown', 'unknown', 'trace'],
    questionHint: 'Identify the glass fragment and the metal sliver, then name who broke in.',
  },
  {
    id: 'fiber_transfer',
    title: 'The Fibre on the Handle',
    categories: ['fiber', 'hair'],
    brief: 'A single fibre and a single hair were caught on the handle of the locked door at {location}, where {victim} was locked out overnight. Identify both, then name who left them there.',
    evidenceKinds: ['unknown', 'unknown', 'trace'],
    questionHint: 'Identify the fibre by burn test and the hair by microscopy, then name who left them.',
  },
  {
    id: 'soil_trace',
    title: 'The Mud on the Floor',
    categories: ['soil', 'fiber'],
    brief: 'Wet soil was tracked across {location} the night {victim}’s supplies went missing. A soil sample was lifted from the floor and a fibre from the torn bag. Identify both, then name who tracked it in.',
    evidenceKinds: ['unknown', 'unknown', 'trace'],
    questionHint: 'Identify the soil and the fibre, then name who tracked it in.',
  },
  {
    id: 'tampered_med',
    title: 'The Swapped Tablets',
    categories: ['tablet', 'clear_liquid'],
    brief: '{victim}’s medication tablets were swapped in the {location} cabinet. Two tablets from the cabinet and one liquid used to coat them must be identified before the substitution can be pinned on someone.',
    evidenceKinds: ['unknown', 'unknown', 'trace'],
    questionHint: 'Identify both tablets and the coating liquid, then name who swapped them.',
  },
];

const VICTIMS = ['the chemistry teacher','the room monitor','the event supervisor','the team captain','the custodian','the club advisor'];
const LOCATIONS = ['Room 214','the science wing storage room','the competition prep lab','the equipment shed','the second-floor hallway','the locker bay by the gym'];

const ALIBIS = [
  'says they were in the library until the building closed',
  'has a timestamped bus pass for the time of the incident',
  'was signed into a practice that ended at the time of the incident',
  'was seen in the hallway by two other students',
  'has no alibi and admits they were looking for a quiet place to study',
  'was off campus all afternoon with a documented appointment',
  'says they left before the incident but no one saw them go',
  'was in the front office signing out equipment at the time of the incident',
];

const MOTIVES = [
  'was passed over for the role they wanted',
  'had a public argument with the victim that week',
  'owed money to the victim',
  'had been accused of cheating by the victim',
  'had sole access to the storage key that week',
  'was in charge of the supplies that went missing',
];

Object.assign(LAB, { FIRST_NAMES: FIRST_NAMES, LAST_NAMES: LAST_NAMES, ROLES: ROLES, CRIME_TYPES: CRIME_TYPES, VICTIMS: VICTIMS, LOCATIONS: LOCATIONS, ALIBIS: ALIBIS, MOTIVES: MOTIVES });
})(window.LAB);
