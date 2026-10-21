(function (LAB) {
'use strict';

// Line drawings for the shelf, plus the live apparatus the stations render into.

const { t } = LAB;

const wrap = (body, vb = '0 0 48 48') =>
  `<svg viewBox="${vb}" class="icon" aria-hidden="true">${body}</svg>`;

const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  box: `<rect x="7" y="14" width="34" height="24" ${STROKE}/><path d="M7 21h34M24 14v7" ${STROKE}/>`,
  cylinder: `<path d="M17 8h14v28a7 7 0 0 1-14 0z" ${STROKE}/><path d="M17 16h6M17 22h6M17 28h6" ${STROKE}/>`,
  beaker: `<path d="M12 12v22a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V12" ${STROKE}/><path d="M12 12l-3-3M12 22h24" ${STROKE}/>`,
  flask: `<path d="M20 8h8v8l8 18a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4l8-18z" ${STROKE}/><path d="M20 16h8" ${STROKE}/>`,
  tube: `<path d="M19 8v26a5 5 0 0 0 10 0V8" ${STROKE}/><path d="M17 8h14" ${STROKE}/>`,
  brush: `<path d="M24 6v22" ${STROKE}/><rect x="18" y="28" width="12" height="14" rx="3" ${STROKE}/><path d="M20 30v10M24 30v10M28 30v10" ${STROKE}/>`,
  holder: `<path d="M10 18h28M14 18v10a10 10 0 0 0 20 0V18" ${STROKE}/><path d="M24 28v12" ${STROKE}/>`,
  rack: `<rect x="8" y="20" width="32" height="14" rx="3" ${STROKE}/><path d="M14 20v-8M24 20v-8M34 20v-8" ${STROKE}/>`,
  petri: `<ellipse cx="24" cy="20" rx="16" ry="7" ${STROKE}/><path d="M8 20v6a16 7 0 0 0 32 0v-6" ${STROKE}/>`,
  spotplate: `<rect x="7" y="14" width="34" height="20" rx="6" ${STROKE}/><circle cx="16" cy="21" r="4" ${STROKE}/><circle cx="32" cy="21" r="4" ${STROKE}/><circle cx="16" cy="30" r="4" ${STROKE}/><circle cx="32" cy="30" r="4" ${STROKE}/>`,
  slide: `<rect x="8" y="19" width="32" height="10" rx="1" ${STROKE}/>`,
  coverslip: `<rect x="16" y="21" width="16" height="6" rx="1" ${STROKE}/>`,
  dropper: `<path d="M24 8v18" ${STROKE}/><circle cx="24" cy="8" r="4" ${STROKE}/><path d="M21 26h6l-3 12z" ${STROKE}/>`,
  spatula: `<path d="M10 38l18-18" ${STROKE}/><ellipse cx="32" cy="16" rx="7" ry="5" transform="rotate(-45 32 16)" ${STROKE}/>`,
  rod: `<path d="M10 38L38 10" ${STROKE}/><circle cx="38" cy="10" r="3" ${STROKE}/>`,
  thermometer: `<path d="M24 8v22" ${STROKE}/><circle cx="24" cy="34" r="6" ${STROKE}/><path d="M30 12h5M30 18h5M30 24h5" ${STROKE}/>`,
  tweezers: `<path d="M18 8l6 22 6-22" ${STROKE}/><path d="M24 30v10" ${STROKE}/>`,
  phpaper: `<rect x="10" y="14" width="28" height="20" rx="2" ${STROKE}/><path d="M10 20h28M10 26h28" ${STROKE}/>`,
  lens: `<circle cx="22" cy="20" r="11" ${STROKE}/><path d="M30 29l8 11" ${STROKE}/>`,
  conductivity: `<rect x="8" y="24" width="14" height="14" rx="2" ${STROKE}/><path d="M22 31h8M30 18v10M38 18v10" ${STROKE}/><circle cx="34" cy="14" r="5" ${STROKE}/>`,
  towel: `<rect x="10" y="16" width="28" height="8" rx="2" ${STROKE}/><rect x="10" y="26" width="28" height="8" rx="2" ${STROKE}/>`,
  pencil: `<path d="M12 36l20-20 5 5-20 20z" ${STROKE}/><path d="M32 16l4-4 5 5-4 4" ${STROKE}/>`,
  ruler: `<rect x="6" y="19" width="36" height="10" rx="1" ${STROKE}/><path d="M12 19v5M18 19v4M24 19v5M30 19v4M36 19v5" ${STROKE}/>`,
  magnet: `<path d="M12 34V20a12 12 0 0 1 24 0v14" ${STROKE}/><path d="M12 34h8M28 34h8" ${STROKE}/>`,
  microscope: `<path d="M14 40h22M18 40V20M18 20h12l-4 8" ${STROKE}/><path d="M28 10v8M24 8h8" ${STROKE}/>`,
  flame: `<path d="M24 8c6 8 10 12 10 18a10 10 0 0 1-20 0c0-6 4-10 10-18z" ${STROKE}/>`,
  balance: `<path d="M8 38h32M24 14v24" ${STROKE}/><path d="M10 14h28" ${STROKE}/><path d="M10 14l-4 8h8zM38 14l-4 8h8z" ${STROKE}/>`,
};

function icon(name) {
  return wrap(ICONS[name] || ICONS.box);
}

// ───────────────────────── live apparatus ─────────────────────────

function spotPlateSvg(wells, selectedWell) {
  const positions = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) positions.push({ id: `${'ABC'[r]}${c + 1}`, cx: 55 + c * 96, cy: 52 + r * 100 });
  const cells = positions.map(w => {
    const content = wells[w.id];
    const fill = content?.mixColor || '#f4f7fa';
    const sel = selectedWell === w.id ? 'well selected' : 'well';
    return `<g class="${sel}" data-well="${w.id}">
      <circle cx="${w.cx}" cy="${w.cy}" r="30" fill="${fill}" stroke="#5b6b7c" stroke-width="2"/>
      ${content?.contaminated ? `<circle cx="${w.cx + 22}" cy="${w.cy - 22}" r="6" fill="#b42318"/>` : ''}
      ${content?.bubbles ? `<circle cx="${w.cx - 8}" cy="${w.cy - 6}" r="4" fill="#fff" opacity=".85"/><circle cx="${w.cx + 7}" cy="${w.cy + 4}" r="3" fill="#fff" opacity=".85"/>` : ''}
      ${content?.precipitate ? `<circle cx="${w.cx}" cy="${w.cy + 8}" r="12" fill="${content.precipitate}" opacity=".8"/>` : ''}
      <text x="${w.cx - 34}" y="${w.cy - 26}" class="well-label" text-anchor="middle">${w.id}</text>
      ${content?.label ? `<text x="${w.cx}" y="${w.cy + 46}" class="well-tag" text-anchor="middle">✎ ${content.label}</text>` : ''}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 400 300" class="apparatus spotplate-live"><rect x="8" y="8" width="384" height="284" rx="26" fill="#f7f9fb" stroke="#c3ccd5" stroke-width="2"/>${cells}</svg>`;
}

// Graduation spacing a real cylinder of that size actually has.
const CYLINDER_GRADUATIONS = {
  10: { major: 2, minor: 1 },
  25: { major: 5, minor: 1 },
  50: { major: 10, minor: 2 },
  100: { major: 20, minor: 5 },
};

function cylinderSvg({ capacity, view = 'eye', liquidMl = 0 }) {
  const grad = CYLINDER_GRADUATIONS[capacity] || { major: capacity / 5, minor: capacity / 10 };
  const h = 220, top = 40;
  const bottom = top + h - 20;
  const zero = bottom - 10;              // 0 mL sits just above the rounded base
  const span = zero - (top + 15);        // the full line sits just below the rim
  // One scale for the graduations, the liquid and the sight line, so a poured
  // volume lands on its own graduation instead of between two of them.
  const yFor = ml => zero - (ml / capacity) * span;
  const surface = yFor(Math.min(liquidMl, capacity));

  const marks = [];
  for (let ml = 0; ml <= capacity; ml += grad.minor) {
    const y = yFor(ml);
    const major = ml % grad.major === 0;
    marks.push(`<line x1="${major ? 120 : 128}" y1="${y}" x2="150" y2="${y}" stroke="#5b6b7c" stroke-width="${major ? 2 : 1}"/>`);
    if (major) marks.push(`<text x="156" y="${y + 4}" class="apparatus-label">${ml}</text>`);
  }
  const eyeLine = view === 'eye'
    ? `<line x1="20" y1="${surface}" x2="118" y2="${surface}" stroke="#1a7f5a" stroke-width="2" stroke-dasharray="6 4"/>`
    : `<line x1="20" y1="${surface - 22}" x2="118" y2="${surface}" stroke="#b3392f" stroke-width="2" stroke-dasharray="6 4"/>`;
  return `<svg viewBox="0 0 220 300" class="apparatus">
    <path d="M120 ${top} h30 v${h - 20} a15 15 0 0 1 -30 0 z" fill="#eef5fb" stroke="#5b6b7c" stroke-width="2"/>
    <rect x="121" y="${surface}" width="28" height="${bottom - surface}" fill="#9ecae6" opacity=".85"/>
    <path d="M121 ${surface} q14 6 28 0" fill="none" stroke="#3d6f96" stroke-width="2"/>
    ${marks.join('')}${eyeLine}
    <text x="135" y="${top - 10}" text-anchor="middle" class="apparatus-label">${t('{capacity} mL cylinder', { capacity })}</text>
  </svg>`;
}

// The strip is drawn against a millimetre ruler and nothing on it is labelled with an
// Rf: reading distances off the ruler and dividing them is the skill being practised.
// Paper edge is 0 mm; the baseline sits 10 mm above it.
const STRIP_MM = 80;
function chromatogramSvg(c) {
  const top = 20, bottom = 300;
  const yFor = mm => bottom - (mm / STRIP_MM) * (bottom - top);
  const baseMm = 10;
  const baselineY = yFor(baseMm);
  const frontY = c.flooded ? null : yFor(baseMm + c.frontMm);
  const ticks = [];
  for (let mm = 0; mm <= STRIP_MM; mm += 2) {
    const y = yFor(mm);
    const major = mm % 10 === 0;
    ticks.push(`<line x1="${major ? 40 : 46}" y1="${y}" x2="56" y2="${y}" stroke="#5b6b7c" stroke-width="${major ? 1.6 : .8}"/>`);
    if (major) ticks.push(`<text x="34" y="${y + 4}" text-anchor="end" class="apparatus-label">${mm}</text>`);
  }
  const dyes = (c.dyes || []).map(d => {
    const y = c.flooded ? baselineY + 4 : yFor(baseMm + d.mm);
    return `<ellipse cx="130" cy="${y}" rx="${c.flooded ? 22 : 15}" ry="${c.flooded ? 4 : 8}" fill="${d.color}" opacity="${c.flooded ? .35 : .85}"/>`;
  }).join('');
  const smear = c.usedPen
    ? `<path d="M100 ${baselineY} C 120 ${baselineY - 60}, 140 ${baselineY - 90}, 160 ${baselineY - 120}" stroke="#2b2f3a" stroke-width="5" opacity=".35" fill="none"/>`
    : '';
  const measured = c.measured
    ? (c.measured.dyes || []).map((mm, i) => `<text x="166" y="${yFor((c.measured.fromBaseline ? baseMm : 0) + mm) + 4}" class="apparatus-label">${t('{n} mm', { n: mm })}</text>`).join('')
    : '';
  return `<svg viewBox="0 0 320 320" class="apparatus">
    <rect x="56" y="${top}" width="4" height="${bottom - top}" fill="#d9d2b5"/>
    ${ticks.join('')}
    <rect x="100" y="${top}" width="60" height="${bottom - top}" fill="#fdfbf4" stroke="#8a8272" stroke-width="2"/>
    ${c.flooded ? '' : `<rect x="101" y="${frontY}" width="58" height="${baselineY - frontY}" fill="#e6f0f7" opacity=".55"/>`}
    <rect x="94" y="${yFor(c.flooded ? 14 : 5)}" width="72" height="${bottom - yFor(c.flooded ? 14 : 5)}" fill="#bcd8ec" opacity=".55"/>
    <line x1="100" y1="${baselineY}" x2="160" y2="${baselineY}" stroke="${c.usedPen ? '#b3392f' : '#333'}" stroke-width="${c.usedPen ? 3 : 1.5}" stroke-dasharray="${c.usedPen ? '0' : '5 3'}"/>
    ${frontY ? `<line x1="100" y1="${frontY}" x2="160" y2="${frontY}" stroke="#3d6f96" stroke-width="2" stroke-dasharray="4 4"/>
    <text x="166" y="${frontY - 6}" class="apparatus-label">${t('solvent front')}</text>` : ''}
    ${smear}${dyes}${measured}
    <text x="166" y="${baselineY + 14}" class="apparatus-label">${c.usedPen ? t('baseline in PEN — ink ran') : t('pencil baseline')}</text>
    ${c.flooded ? `<text x="130" y="${baselineY + 34}" text-anchor="middle" class="apparatus-label warn-text">${t('solvent was above the baseline')}</text>` : ''}
  </svg>`;
}

function microscopeSvg({ sample, magnification = 40, bubbles = false, measured = false }) {
  const md = sample.microData || {};
  // Higher magnification means a bigger image in the field, not a smaller one.
  const scale = magnification === 40 ? 1.8 : 0.5;
  const hairW = (md.diameterUm || 80) * scale * 0.9;
  const medW = (md.medullaUm || 20) * scale * 0.9;
  const cy = 160, x0 = 30, x1 = 470;
  const scales = Array.from({ length: 18 }, (_, i) => {
    const x = x0 + i * ((x1 - x0) / 18);
    return `<path d="M${x} ${cy - hairW / 2} q6 -8 12 0" fill="none" stroke="#7a6a55" stroke-width="1.5"/>`;
  }).join('');
  const pigment = Array.from({ length: 14 }, (_, i) => {
    const x = x0 + 20 + i * 30;
    const y = cy + (i % 3 - 1) * (hairW / 6);
    return `<circle cx="${x}" cy="${y}" r="3" fill="#4a3b2a" opacity=".55"/>`;
  }).join('');
  const bubbleMarks = bubbles ? Array.from({ length: 6 }, (_, i) =>
    `<circle cx="${80 + i * 60}" cy="${90 + (i % 2) * 120}" r="${10 + i * 2}" fill="none" stroke="#9db4c8" stroke-width="2"/>`).join('') : '';
  return `<svg viewBox="0 0 500 320" class="apparatus micro-field">
    <circle cx="250" cy="160" r="150" fill="#f7f4ea" stroke="#33414f" stroke-width="3"/>
    <clipPath id="field"><circle cx="250" cy="160" r="148"/></clipPath>
    <g clip-path="url(#field)">
      <rect x="${x0}" y="${cy - hairW / 2}" width="${x1 - x0}" height="${hairW}" fill="#d8c9ae" stroke="#8a7659" stroke-width="2"/>
      <rect x="${x0}" y="${cy - medW / 2}" width="${x1 - x0}" height="${medW}" fill="#b79a72" opacity=".85"/>
      ${scales}${pigment}${bubbleMarks}
      <line x1="250" y1="20" x2="250" y2="300" stroke="#c8d3de" stroke-width="1"/>
      <line x1="110" y1="160" x2="390" y2="160" stroke="#c8d3de" stroke-width="1"/>
    </g>
    ${measured && magnification === 40 ? `<g class="reticle">
      <line x1="${x0}" y1="${cy + hairW / 2 + 18}" x2="${x1}" y2="${cy + hairW / 2 + 18}" stroke="#1a7f5a" stroke-width="2"/>
      <text x="250" y="${cy + hairW / 2 + 36}" text-anchor="middle" class="apparatus-label">${t('hair diameter {v} µm', { v: md.diameterUm })}</text>
      <line x1="${x0}" y1="${cy - hairW / 2 - 18}" x2="${x1}" y2="${cy - hairW / 2 - 18}" stroke="#8a4bb0" stroke-width="2"/>
      <text x="250" y="${cy - hairW / 2 - 24}" text-anchor="middle" class="apparatus-label">${t('medulla {v} µm', { v: md.medullaUm })}</text>
    </g>` : ''}
    <text x="490" y="310" text-anchor="end" class="apparatus-label">${magnification}×</text>
  </svg>`;
}

function phStripSvg(ph) {
  const color = ph == null ? '#dfe6ec'
    : ph < 3 ? '#c0392b' : ph < 5 ? '#d9722c' : ph < 6.5 ? '#d9a520'
    : ph <= 7.5 ? '#4caf50' : ph < 9.5 ? '#2f9e8f' : ph < 11 ? '#2f6fb0' : '#5b3fa8';
  const chart = [2, 4, 6, 7, 8, 10, 12].map((v, i) => {
    const c = v < 3 ? '#c0392b' : v < 5 ? '#d9722c' : v < 6.5 ? '#d9a520' : v <= 7.5 ? '#4caf50' : v < 9.5 ? '#2f9e8f' : v < 11 ? '#2f6fb0' : '#5b3fa8';
    return `<rect x="${20 + i * 44}" y="150" width="40" height="22" fill="${c}"/><text x="${40 + i * 44}" y="190" text-anchor="middle" class="apparatus-label">${v}</text>`;
  }).join('');
  return `<svg viewBox="0 0 340 210" class="apparatus">
    <rect x="20" y="40" width="120" height="34" rx="3" fill="${color}" stroke="#5b6b7c" stroke-width="2"/>
    <text x="80" y="30" text-anchor="middle" class="apparatus-label">${t('your strip')}</text>
    <text x="170" y="130" text-anchor="middle" class="apparatus-label">${t('compare against the chart')}</text>
    ${chart}
  </svg>`;
}

function conductivitySvg(level) {
  const brightness = { none: 0.08, weak: 0.45, strong: 1 }[level] ?? 0.08;
  return `<svg viewBox="0 0 300 200" class="apparatus">
    <rect x="20" y="120" width="80" height="50" rx="4" fill="#e7edf2" stroke="#5b6b7c" stroke-width="2"/>
    <text x="60" y="150" text-anchor="middle" class="apparatus-label">9V</text>
    <path d="M100 145h50M150 60v50M200 60v50" fill="none" stroke="#5b6b7c" stroke-width="2"/>
    <circle cx="175" cy="50" r="22" fill="#ffd75e" opacity="${brightness}" stroke="#5b6b7c" stroke-width="2"/>
    ${level === 'strong' ? '<circle cx="175" cy="50" r="34" fill="#ffd75e" opacity=".3"/>' : ''}
    <rect x="140" y="120" width="70" height="60" rx="4" fill="#cfe6f5" stroke="#5b6b7c" stroke-width="2"/>
    <line x1="150" y1="120" x2="150" y2="165" stroke="#333" stroke-width="3"/>
    <line x1="200" y1="120" x2="200" y2="165" stroke="#333" stroke-width="3"/>
  </svg>`;
}

function thermometerSvg(temp) {
  const frac = temp == null ? 0 : Math.max(0, Math.min(1, (temp - 0) / 110));
  return `<svg viewBox="0 0 120 280" class="apparatus">
    <rect x="50" y="30" width="20" height="190" rx="10" fill="#f6f9fb" stroke="#5b6b7c" stroke-width="2"/>
    <circle cx="60" cy="235" r="20" fill="#c0392b" stroke="#5b6b7c" stroke-width="2"/>
    <rect x="55" y="${225 - frac * 190}" width="10" height="${frac * 190}" fill="#c0392b"/>
    ${Array.from({ length: 12 }, (_, i) => `<line x1="74" y1="${40 + i * 16}" x2="88" y2="${40 + i * 16}" stroke="#5b6b7c" stroke-width="1"/>`).join('')}
  </svg>`;
}

function burnSvg(result) {
  const flame = result?.flammable
    ? '<path d="M150 60c14 18 22 26 22 40a22 22 0 0 1-44 0c0-14 8-22 22-40z" fill="#ffb347" stroke="#c0392b" stroke-width="2"/>'
    : '<path d="M120 100h60" stroke="#5b6b7c" stroke-width="2" fill="none"/>';
  return `<svg viewBox="0 0 300 200" class="apparatus">
    ${flame}
    <path d="M150 100v60" stroke="#8a7659" stroke-width="3"/>
    <rect x="120" y="160" width="60" height="18" rx="4" fill="#e7edf2" stroke="#5b6b7c" stroke-width="2"/>
    <text x="150" y="196" text-anchor="middle" class="apparatus-label">${t('fume hood · tweezers required')}</text>
  </svg>`;
}

// A beaker of water with the item either floating at the surface or resting on the bottom.
function beakerSvg(result) {
  const item = result === 'floats'
    ? '<rect x="130" y="92" width="40" height="14" rx="3" fill="#c9b48a" stroke="#7a6a55" stroke-width="1.5"/>'
    : result === 'sinks'
      ? '<rect x="130" y="176" width="40" height="14" rx="3" fill="#8a8f99" stroke="#4a4f59" stroke-width="1.5"/>'
      : '';
  return `<svg viewBox="0 0 300 220" class="apparatus">
    <path d="M90 40v150a10 10 0 0 0 10 10h100a10 10 0 0 0 10-10V40" fill="#eef5fb" stroke="#5b6b7c" stroke-width="2"/>
    <rect x="91" y="100" width="118" height="99" fill="#9ecae6" opacity=".6"/>
    <path d="M91 100h118" stroke="#3d6f96" stroke-width="2"/>
    ${[60, 100, 140, 180].map(y => `<line x1="90" y1="${y}" x2="104" y2="${y}" stroke="#5b6b7c"/>`).join('')}
    ${item}
  </svg>`;
}

function balanceSvg(mass) {
  return `<svg viewBox="0 0 300 180" class="apparatus">
    <rect x="40" y="120" width="220" height="30" rx="4" fill="#e7edf2" stroke="#5b6b7c" stroke-width="2"/>
    <rect x="110" y="60" width="80" height="60" rx="4" fill="#f6f9fb" stroke="#5b6b7c" stroke-width="2"/>
    <rect x="122" y="40" width="56" height="8" rx="2" fill="#fdfbf4" stroke="#8a8272"/>
    <text x="150" y="98" text-anchor="middle" class="apparatus-readout">${mass == null ? '0.00 g' : mass.toFixed(2) + ' g'}</text>
  </svg>`;
}

LAB.svg = { ICONS: ICONS, icon: icon, spotPlateSvg: spotPlateSvg, cylinderSvg: cylinderSvg, chromatogramSvg: chromatogramSvg, microscopeSvg: microscopeSvg, phStripSvg: phStripSvg, conductivitySvg: conductivitySvg, thermometerSvg: thermometerSvg, burnSvg: burnSvg, beakerSvg: beakerSvg, balanceSvg: balanceSvg };
})(window.LAB);
