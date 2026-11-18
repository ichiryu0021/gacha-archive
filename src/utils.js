import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function hash(text, len = 16) {
  return crypto.createHash('sha1').update(String(text)).digest('hex').slice(0, len);
}

export function uid(prefix = '') {
  return prefix + crypto.randomBytes(9).toString('base64url');
}

export function parseJson(text, fallback = null) {
  try { return JSON.parse(text); } catch { return fallback; }
}

export function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

export async function writeJsonAtomic(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fsp.rename(tmp, file);
}

export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

export function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function maskSecret(text, key = 'authkey') {
  if (!text) return '';
  const re = new RegExp(`([?&]${key}=)([^&#]+)`, 'gi');
  return String(text).replace(re, (_, a, b) => `${a}${b.slice(0, 4)}***${b.slice(-3)}`);
}

export function normalizeName(name) {
  return String(name || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000「」『』【】\[\]（）()·•・.,，。:：;；'"“”‘’\-—–_/\\|+]/g, '')
    .replace(/[★☆]/g, '');
}

export function compactName(name) {
  return normalizeName(name).replace(/[^\p{L}\p{N}]/gu, '');
}

export function levenshtein(a, b) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 4) return Math.max(a.length, b.length);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

export function similarity(a, b) {
  a = compactName(a); b = compactName(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const dist = levenshtein(a, b);
  const base = Math.max(a.length, b.length);
  let score = 1 - dist / base;
  if (a.includes(b) || b.includes(a)) score = Math.max(score, Math.min(a.length, b.length) / base + 0.12);
  return clamp(score, 0, 1);
}

export function normalizeDateString(value) {
  const s = String(value || '').trim();
  const m = s.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})[日]?\s*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?/);
  if (!m) return null;
  const [, y, mo, d, h = '0', mi = '0', sec = '0'] = m;
  const pad = (x) => String(x).padStart(2, '0');
  return `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}:${pad(sec)}`;
}

export function datePart(time) {
  return String(time || '').slice(0, 10);
}

export function monthPart(time) {
  return String(time || '').slice(0, 7);
}

export function parseTimestamp(time, timezone = 8) {
  if (!time) return 0;
  const s = String(time).replace(' ', 'T');
  const isoTz = /([+-]\d{2}:?\d{2}|Z)$/.test(s) ? s : `${s}${timezone >= 0 ? '+' : '-'}${String(Math.abs(timezone)).padStart(2, '0')}:00`;
  const t = Date.parse(isoTz);
  return Number.isFinite(t) ? t : Date.parse(`${s}Z`) || 0;
}

export function withinPeriod(time, start, end) {
  if (!time) return false;
  const day = datePart(time);
  if (start && day < String(start).slice(0, 10)) return false;
  if (end && day > String(end).slice(0, 10)) return false;
  return true;
}

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function safeNumberId(value) {
  return String(value ?? '').replace(/[^\d]/g, '');
}

export function pick(obj, keys) {
  const out = {};
  for (const key of keys) if (obj[key] !== undefined) out[key] = obj[key];
  return out;
}

export function median(values) {
  const arr = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!arr.length) return 0;
  return arr[Math.floor(arr.length / 2)];
}

export function toBase64Url(buf) {
  return Buffer.from(buf).toString('base64url');
}

export async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}
