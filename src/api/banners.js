import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.js';

const BANNER_FILE = path.join(ROOT, 'src', 'data', 'banners.json');
let cached = null;

function load() {
  if (cached) return cached;
  try { cached = JSON.parse(fs.readFileSync(BANNER_FILE, 'utf8')); }
  catch { cached = { arknights: [], endfield: [], nte: [] }; }
  return cached;
}

function norm(value) {
  return String(value || '').replace(/[「」『』“”"\s·•]/g, '').trim();
}

function parseTime(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  const withZone = /[zZ]|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}+08:00`;
  return Date.parse(withZone) || 0;
}

function inRange(recordTime, banner) {
  if (!recordTime) return false;
  const time = parseTime(recordTime);
  if (!time) return false;
  const start = parseTime(banner.start);
  const end = banner.end ? parseTime(banner.end) : Infinity;
  return time >= start && time <= end;
}

function typeMatches(record, banner) {
  const type = String(record.uigfType || record.gachaType || '');
  if (!type || !banner.type) return true;
  if (type === banner.type) return true;
  // 联合/其他池的名称不一定和内部 type 一致，用名称兜底。
  const poolName = norm(record.poolName);
  return Boolean(poolName && [banner.name, ...(banner.aliases || [])].some((name) => poolName.includes(norm(name))));
}

function namesOf(record) {
  return new Set([record.name, ...(record.aliases || [])].map(norm).filter(Boolean));
}

function isUp(banner, names) {
  const up = [...(banner.up || []), ...(banner.aliasesUp || [])].map(norm);
  return up.some((name) => names.has(name));
}

export function bannersFor(gameId) {
  return load()[gameId] || [];
}

export function bannersAsOf() {
  return load().asOf || '';
}

export function currentBanners(gameId, at = new Date()) {
  const time = typeof at === 'number' ? at : Date.parse(at);
  return bannersFor(gameId).filter((banner) => {
    const start = parseTime(banner.start);
    const end = banner.end ? parseTime(banner.end) : Infinity;
    return start <= time && time <= end;
  });
}

export function inferBannerUp(gameId, record) {
  if (!record || Number(record.rank) !== 5) return null;
  const names = namesOf(record);
  if (!names.size) return null;
  const candidates = bannersFor(gameId).filter((banner) => inRange(record.time, banner) && typeMatches(record, banner));
  if (!candidates.length) return null;
  // 同一时间可能有多个池；优先名称能对上的。
  const poolName = norm(record.poolName);
  candidates.sort((a, b) => {
    const score = (banner) => [banner.name, ...(banner.aliases || [])].some((name) => poolName.includes(norm(name))) ? 1 : 0;
    return score(b) - score(a);
  });
  const banner = candidates[0];
  if (isUp(banner, names)) return 'win';
  const known = [...(banner.up || []), ...(banner.offRate || []), ...(banner.sixStars || [])].map(norm).filter(Boolean);
  if (!known.length) return null;
  // 有明确 UP 列表时，名单外的最高稀有度视为歪；名单内非 UP 也是歪。
  if ((banner.up || []).length || (banner.offRate || []).length || (banner.sixStars || []).length) return 'loss';
  return null;
}
