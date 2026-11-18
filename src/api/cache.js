import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { GAMES, GAME_IDS } from '../config.js';
import { hash } from '../utils.js';
import { parseGachaLink, rememberSource } from './gacha.js';

const LOG_CANDIDATES = {
  genshin: [
    ['AppData/LocalLow/miHoYo/原神/output_log.txt', 'GenshinImpact_Data|YuanShen_Data'],
    ['AppData/LocalLow/miHoYo/Genshin Impact/output_log.txt', 'GenshinImpact_Data|YuanShen_Data'],
    ['AppData/LocalLow/miHoYo/Genshin Impact/output_log.txt', 'GenshinImpact_Data'],
    ['AppData/Local/miHoYo/GenshinImpactCloudGame/config/logs/MiHoYoSDK.log', 'GenshinImpact_Data'],
  ],
  hsr: [
    ['AppData/LocalLow/miHoYo/崩坏：星穹铁道/Player.log', 'StarRail_Data'],
    ['AppData/LocalLow/Cognosphere/Star Rail/Player.log', 'StarRail_Data'],
    ['AppData/LocalLow/miHoYo/崩坏：星穹铁道/output_log.txt', 'StarRail_Data'],
  ],
  zzz: [
    ['AppData/LocalLow/miHoYo/绝区零/Player.log', 'ZenlessZoneZero_Data'],
    ['AppData/LocalLow/miHoYo/ZenlessZoneZero/Player.log', 'ZenlessZoneZero_Data'],
  ],
};

const FILE_URL_CACHE = new Map();

const GAME_DATA_DIRS = {
  genshin: /(GenshinImpact_Data|YuanShen_Data)/i,
  hsr: /StarRail_Data/i,
  zzz: /ZenlessZoneZero_Data/i,
};

async function readTail(file, maxBytes = 4 * 1024 * 1024) {
  try {
    const st = await fsp.stat(file);
    const start = Math.max(0, st.size - maxBytes);
    const fh = await fsp.open(file, 'r');
    try {
      const buf = Buffer.alloc(st.size - start);
      await fh.read(buf, 0, buf.length, start);
      return buf.toString('utf8');
    } finally { await fh.close(); }
  } catch { return ''; }
}

function extractInstallPaths(text, dataDirPattern) {
  const out = new Set();
  const re = new RegExp(`([A-Za-z]:[\\\\/][^\\r\\n"'<>|?*]{1,500}?(?:${dataDirPattern.source}))`, 'gi');
  let m;
  while ((m = re.exec(text))) {
    let p = m[1].replace(/[\\/]+$/, '');
    // logs sometimes append a slash or quote; trim garbage after the data dir
    const idx = p.search(dataDirPattern);
    if (idx >= 0) p = p.slice(0, idx + (p.slice(idx).match(dataDirPattern)?.[0]?.length || 0));
    out.add(p);
  }
  return [...out];
}

export function extractUrlsFromBuffer(buf) {
  const urls = new Set();
  const add = (text) => {
    const cleaned = String(text)
      .replace(/\\u0026/gi, '&')
      .replace(/&amp;/g, '&')
      .replace(/[\u0000-\u001f"'<>]+$/g, '')
      .replace(/#\/log.*$/i, '')
      .replace(/#+$/g, '');
    if (cleaned.includes('authkey=')) urls.add(cleaned);
  };
  const ascii = buf.toString('utf8', 0, Math.min(buf.length, 40 * 1024 * 1024));
  for (const m of ascii.matchAll(/https?:\/\/[^\x00-\x20"'<>]{20,}/g)) add(m[0]);
  if (urls.size === 0) {
    const utf16 = buf.toString('utf16le', 0, Math.min(buf.length, 40 * 1024 * 1024));
    for (const m of utf16.matchAll(/https?:\/\/[^\x00-\x20"'<>]{20,}/g)) add(m[0]);
  }
  return [...urls].filter((u) => /getGachaLog|e20190909gacha|real_gacha_type|gacha_type=/i.test(u));
}

async function readCacheFile(file) {
  try { return await fsp.readFile(file); } catch (e) {
    if (['EBUSY', 'EPERM', 'EACCES'].includes(e.code)) {
      const tmp = path.join(os.tmpdir(), `gacha-cache-${hash(file, 10)}.tmp`);
      try {
        await fsp.copyFile(file, tmp);
        const buf = await fsp.readFile(tmp);
        await fsp.unlink(tmp).catch(() => {});
        return buf;
      } catch { /* fall through */ }
    }
    throw e;
  }
}

async function findData2Files(installDir) {
  const out = [];
  const caches = path.join(installDir, 'webCaches');
  try {
    const entries = await fsp.readdir(caches, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const p = path.join(caches, ent.name, 'Cache', 'Cache_Data', 'data_2');
        if (fs.existsSync(p)) out.push(p);
      }
    }
    const direct = path.join(caches, 'Cache', 'Cache_Data', 'data_2');
    if (fs.existsSync(direct)) out.push(direct);
  } catch { /* no cache */ }
  return out;
}

function scoreUrl(url) {
  let score = 0;
  try {
    const u = new URL(url);
    const ts = Number(u.searchParams.get('timestamp') || 0);
    if (ts) score += Math.min(ts / 1e10, 1000);
    if (/getGachaLog/i.test(u.pathname)) score += 50;
    if (u.searchParams.get('auth_appid') === 'webview_gacha') score += 20;
    if (u.searchParams.get('gacha_type') || u.searchParams.get('real_gacha_type')) score += 5;
  } catch { /* ignore */ }
  return score;
}

export async function scanLocalLinks(options = {}) {
  const home = options.home || os.homedir();
  const diagnostics = [];
  const found = {};
  for (const gameId of GAME_IDS) {
    const game = GAMES[gameId];
    const entries = [];
    const installDirs = new Set();
    for (const [rel, pattern] of (LOG_CANDIDATES[gameId] || [])) {
      const logPath = path.join(home, rel);
      if (!fs.existsSync(logPath)) {
        diagnostics.push({ game: gameId, type: 'log', path: logPath, exists: false });
        continue;
      }
      const text = await readTail(logPath);
      diagnostics.push({ game: gameId, type: 'log', path: logPath, exists: true, size: text.length });
      for (const u of text.matchAll(/https?:\/\/[^\s"'<>]{20,}/g)) {
        if (u[0].includes('authkey=')) entries.push({ url: u[0], source: logPath });
      }
      for (const dir of extractInstallPaths(text, GAME_DATA_DIRS[gameId])) installDirs.add(dir);
    }
    for (const dir of installDirs) {
      const files = await findData2Files(dir);
      diagnostics.push({ game: gameId, type: 'webcache', installDir: dir, files });
      for (const file of files) {
        try {
          const st = await fsp.stat(file);
          const cached = FILE_URL_CACHE.get(file);
          let urls;
          if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size) {
            urls = cached.urls;
          } else {
            const buf = await readCacheFile(file);
            urls = extractUrlsFromBuffer(buf);
            FILE_URL_CACHE.set(file, { mtimeMs: st.mtimeMs, size: st.size, urls });
          }
          for (const url of urls) entries.push({ url, source: file });
        } catch (e) {
          diagnostics.push({ game: gameId, type: 'webcache-error', file, error: e.message });
        }
      }
    }
    let best = null;
    for (const entry of entries) {
      try {
        const source = parseGachaLink(entry.url);
        if (source.game !== gameId) continue;
        const score = scoreUrl(entry.url);
        if (!best || score >= best.score) best = { source, score, sourcePath: entry.source };
      } catch { /* not a usable gacha URL */ }
    }
    if (best) {
      best.source.source = 'webcache';
      best.source.cachePath = best.sourcePath;
      const linkId = rememberSource(best.source);
      found[gameId] = {
        linkId,
        game: gameId,
        gameName: game.name,
        preview: `authkey=${best.source.authkey.slice(0, 4)}***${best.source.authkey.slice(-3)}`,
        region: best.source.region,
        gameBiz: best.source.gameBiz,
        isOversea: best.source.isOversea,
        sourcePath: best.sourcePath,
        capturedAt: new Date().toISOString(),
      };
    }
  }
  return { found, diagnostics, scannedAt: new Date().toISOString() };
}
