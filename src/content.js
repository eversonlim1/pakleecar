const fs = require('node:fs');
const path = require('node:path');
const { LANGS, DEFAULT_LANG } = require('../build.config');

const ROOT = path.join(__dirname, '..', 'content');

function readJson(lang, slug) {
  const file = path.join(ROOT, lang, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function deepMerge(base, over) {
  if (over === null || over === undefined) return base;
  if (Array.isArray(base) || typeof base !== 'object') return over;
  if (typeof over !== 'object' || Array.isArray(over)) return over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
  return out;
}

function load(lang, slug) {
  const fallback = readJson(DEFAULT_LANG, slug);
  const own = readJson(lang, slug);
  if (!fallback && !own) throw new Error(`content missing: ${slug}`);
  const data = deepMerge(fallback || {}, own || {});
  assertSeo(data, `${lang}/${slug}`);
  return data;
}

function loadAll(slug) {
  const out = {};
  for (const lang of LANGS) out[lang] = load(lang, slug);
  return out;
}

function assertSeo(data, where) {
  const seo = data && data.seo;
  if (!seo || !seo.title) throw new Error(`${where}: seo.title 누락`);
  if (!seo.description) throw new Error(`${where}: seo.description 누락`);
  if (seo.title.length > 60) throw new Error(`${where}: seo.title 60자 초과 (${seo.title.length})`);
  if (seo.description.length > 160) {
    throw new Error(`${where}: seo.description 160자 초과 (${seo.description.length})`);
  }
  return true;
}

module.exports = { load, loadAll, assertSeo };
