import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config.js';

const TABLES = {};
for (const game of ['zzz', 'genshin', 'hsr', 'hi3', 'tot']) {
  try {
    const file = path.join(DATA_DIR, `versions-${game}.json`);
    TABLES[game] = JSON.parse(fs.readFileSync(file, 'utf8'))
      .map((row) => ({ version: String(row.version), start: String(row.start).slice(0, 10) }))
      .sort((a, b) => a.start.localeCompare(b.start));
  } catch {
    TABLES[game] = [];
  }
}

export function versionFor(game, time) {
  const day = String(time || '').slice(0, 10);
  if (!day) return null;
  let found = null;
  for (const row of TABLES[game] || []) {
    if (row.start <= day) found = row.version;
    else break;
  }
  return found;
}

export function versionOrder(game) {
  return (TABLES[game] || []).map((row) => row.version);
}
