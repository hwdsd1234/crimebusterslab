(function (LAB) {
'use strict';

// Language layer. English stays the canonical language inside the engine: state,
// tokens, sample ids and question answers are never translated, so switching
// language is a re-render and never a reset.
//
// 'both' is the default — the event is run in English, so students need the
// English term and the Chinese one on the same screen.

const { ZH_UI } = LAB;
const { ZH_DEVICES } = LAB;
const { ZH_SAMPLES } = LAB;
const { ZH_BIO } = LAB;
const { ZH_CASE } = LAB;
const { ZH_SIM } = LAB;

const LANGS = ['both', 'en', 'zh'];
const STORAGE_KEY = 'cb-lab-lang';

const ZH = Object.assign({}, ZH_UI, ZH_DEVICES, ZH_SAMPLES, ZH_BIO, ZH_CASE, ZH_SIM);

let lang = 'both';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (LANGS.includes(saved)) lang = saved;
} catch { /* storage unavailable — the lab still runs in memory */ }

// Keys asked for in a Chinese mode that have no entry yet. The verify harness
// asserts this stays empty; a miss silently renders English.
const UNTRANSLATED = new Set();

function getLang() { return lang; }

function setLang(next) {
  if (!LANGS.includes(next)) return lang;
  lang = next;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  syncDocumentLang();
  return lang;
}

function syncDocumentLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}

function fill(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

function both(en) {
  const zh = ZH[en];
  if (zh === undefined) { UNTRANSLATED.add(en); return null; }
  return zh;
}

const CJK = new RegExp('[\\u3000-\\u303f\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef]');

// True when a value handed to t() is already a rendered bilingual string. Nesting one
// translation inside another otherwise prints the whole sentence twice.
function alreadyTranslated(vars) {
  return Object.values(vars || {}).some(v => typeof v === 'string' && CJK.test(v));
}

function t(en, vars) {
  if (lang === 'en') return fill(en, vars);
  const zh = both(en);
  if (!zh) return fill(en, vars);
  if (lang === 'zh') return fill(zh, vars);
  const enSide = fill(en, vars);
  // A term that is the same in both languages (pH, Rf) must not be printed twice.
  if (zh === en || alreadyTranslated(vars)) return enSide;
  return `${enSide} ${fill(zh, vars)}`;
}

// Block-level text: in 'both' the Chinese goes on its own line instead of being
// glued onto the end of an already long English sentence.
function tb(en, vars) {
  if (lang === 'en') return fill(en, vars);
  const zh = both(en);
  if (!zh) return fill(en, vars);
  if (lang === 'zh') return fill(zh, vars);
  const enSide = fill(en, vars);
  if (zh === en || alreadyTranslated(vars)) return enSide;
  return `${enSide}<br>${fill(zh, vars)}`;
}

// Values that are already resolved strings (a sample name, a burn odour) and may
// or may not have an entry.
function tv(value) {
  return t(String(value));
}

// For a composed string stored as {key, vars}: translate each value, then fill.
function tVars(key, vars) {
  const out = {};
  for (const [k, v] of Object.entries(vars || {})) out[k] = typeof v === 'string' ? t(v) : v;
  return t(key, out);
}

Object.assign(LAB, { LANGS: LANGS, UNTRANSLATED: UNTRANSLATED, getLang: getLang, setLang: setLang, syncDocumentLang: syncDocumentLang, t: t, tb: tb, tv: tv, tVars: tVars });
})(window.LAB);
