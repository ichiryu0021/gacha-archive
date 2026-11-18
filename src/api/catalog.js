import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { ASSET_DIR, DATA_DIR, GAME_IDS, isAllowedAssetHost } from '../config.js';
import { hash, normalizeName, similarity, writeJsonAtomic } from '../utils.js';

const CATALOG_FILES = Object.fromEntries(GAME_IDS.map((g) => [g, path.join(DATA_DIR, `catalog-${g}.json`)]));
const HSR_BASE = 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/';
const ZZZ_WIKI = 'https://sg-act-public-api.hoyolab.com/hoyowiki/zzz/wapi/get_entry_page_list';

const cache = new Map();

function buildIndex(catalog) {
  const byName = new Map();
  const byId = new Map();
  for (const item of catalog.items) {
    byId.set(String(item.id), item);
    const keys = new Set([
      normalizeName(item.name),
      normalizeName(item.name.replace(/[「」]/g, '')),
      ...(item.aliases || []).map((v) => normalizeName(v)),
    ]);
    for (const key of keys) {
      if (!key) continue;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(item);
    }
  }
  return { ...catalog, byName, byId };
}

export function loadCatalog(game) {
  if (cache.has(game)) return cache.get(game);
  const fallback = { game, items: [], updatedAt: null, source: 'bundled', version: '0' };
  let raw = fallback;
  try { raw = JSON.parse(fs.readFileSync(CATALOG_FILES[game], 'utf8')); } catch {}
  const catalog = buildIndex(raw);
  cache.set(game, catalog);
  return catalog;
}

export function allCatalogs() {
  return Object.fromEntries(GAME_IDS.map((g) => [g, loadCatalog(g)]));
}

export function matchItem(game, rawName, type = '') {
  const catalog = loadCatalog(game);
  const q = normalizeName(rawName);
  if (!q) return { item: null, confidence: 0 };
  const exact = catalog.byName.get(q);
  if (exact?.length) {
    const sameType = type ? exact.find((i) => i.type === type) : exact[0];
    return { item: sameType || exact[0], confidence: 1 };
  }
  let best = null;
  let bestScore = 0;
  let second = 0;
  for (const item of catalog.items) {
    if (type && item.type !== type) continue;
    const score = similarity(q, item.name);
    if (score > bestScore) { second = bestScore; bestScore = score; best = item; }
    else if (score > second) second = score;
  }
  if (!best || bestScore < 0.56) return { item: null, confidence: bestScore };
  const margin = bestScore - second;
  const confidence = Math.min(0.95, bestScore * 0.9 + Math.min(0.1, margin * 0.5));
  return { item: best, confidence };
}

function rankMap(r) { return r >= 4 ? 5 : r === 3 ? 4 : 3; }

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'GachaArchive/0.9' }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function syncHsr() {
  const chars = await fetchJson(`${HSR_BASE}index_new/cn/characters.json`);
  const cones = await fetchJson(`${HSR_BASE}index_new/cn/light_cones.json`);
  const items = [
    ...Object.entries(chars).filter(([, v]) => v.name && !v.name.includes('{')).map(([id, v]) => ({ id: String(id), name: v.name, type: '角色', rarity: v.rarity, iconUrl: HSR_BASE + v.icon, path: v.path, element: v.element })),
    ...Object.entries(cones).map(([id, v]) => ({ id: String(id), name: v.name, type: '光锥', rarity: v.rarity, iconUrl: HSR_BASE + v.icon, path: v.path })),
  ];
  return {
    game: 'hsr', version: 'live', source: 'Mar-7th/StarRailRes', updatedAt: new Date().toISOString(),
    items: items.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
  };
}

async function fetchZzzWiki(menuId) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(ZZZ_WIKI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rpc-language': 'zh-cn',
        'x-rpc-wiki_app': 'zzz',
        Referer: 'https://wiki.hoyolab.com/',
        'User-Agent': 'GachaArchive/0.9',
      },
      body: JSON.stringify({ filters: [], menu_id: String(menuId), page_num: page, page_size: 30, use_es: true }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`HoYoWiki HTTP ${res.status}`);
    const json = await res.json();
    if (json.retcode !== 0) throw new Error(json.message || `HoYoWiki ${json.retcode}`);
    const list = json.data?.list || [];
    out.push(...list);
    if (list.length < 30 || out.length >= (json.data?.total || 0)) break;
  }
  return out;
}

async function syncZzz() {
  const [agents, engines, bangboo] = await Promise.all([fetchZzzWiki(8), fetchZzzWiki(11), fetchZzzWiki(15)]);
  const items = [];
  for (const item of agents) {
    const rarity = item.filter_values?.agent_rarity?.values?.[0] === 'S' ? 5 : 4;
    items.push({ id: String(item.entry_page_id || ''), name: item.name, aliases: item.name.includes('·') ? [item.name.split('·')[0]] : [], type: '代理人', rarity, iconUrl: item.icon_url || '', element: item.filter_values?.agent_stats?.values?.[0] || '' });
  }
  for (const item of engines) {
    const rarity = item.filter_values?.w_engine_rarity?.values?.[0] === 'S' ? 5 : 4;
    items.push({ id: String(item.entry_page_id || ''), name: item.name, type: '音擎', rarity, iconUrl: item.icon_url || '', path: item.filter_values?.filter_key_13?.values?.[0] || '' });
  }
  for (const item of bangboo) {
    const rarity = item.filter_values?.bangboo_rarity?.values?.[0] === 'S' ? 5 : 4;
    items.push({ id: String(item.entry_page_id || ''), name: item.name, type: '邦布', rarity, iconUrl: item.icon_url || '' });
  }
  return {
    game: 'zzz', version: 'official-wiki', source: 'HoYoWiki (official)', updatedAt: new Date().toISOString(),
    items: items.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
  };
}

export async function syncCatalog(game) {
  if (game === 'genshin') {
    const catalog = loadCatalog('genshin');
    return { ok: true, mode: 'bundled', count: catalog.items.length, message: '原神图鉴已内置 7.2 数据；图标走米哈游官方 CDN。版本更新后运行 scripts/build-catalogs.mjs 可刷新。' };
  }
  const data = game === 'hsr' ? await syncHsr() : game === 'zzz' ? await syncZzz() : null;
  if (!data) throw new Error('不支持的游戏');
  if (!data.items.length) throw new Error('数据源返回为空');
  const current = loadCatalog(game);
  const same = current.items.length === data.items.length && JSON.stringify(current.items) === JSON.stringify(data.items);
  if (same) {
    prefetchAssets(game).catch(() => {});
    return { ok: true, mode: 'cached', count: current.items.length, updatedAt: current.updatedAt, source: current.source };
  }
  await writeJsonAtomic(CATALOG_FILES[game], data);
  cache.delete(game);
  loadCatalog(game);
  prefetchAssets(game).catch(() => {});
  return { ok: true, mode: 'live', count: data.items.length, updatedAt: data.updatedAt, source: data.source };
}

const prefetching = new Set();

export async function prefetchAssets(game) {
  const catalog = loadCatalog(game);
  if (prefetching.has(game)) return;
  prefetching.add(game);
  const queue = catalog.items.filter((i) => i.iconUrl).map((i) => i.iconUrl);
  const failed = new Set();
  const worker = async () => {
    while (queue.length) {
      const target = queue.shift();
      if (!target || failed.has(target)) continue;
      let parsed;
      try { parsed = new URL(target); } catch { continue; }
      if (!/^https?:$/.test(parsed.protocol) || !isAllowedAssetHost(parsed.hostname)) continue;
      const ext = path.extname(parsed.pathname).slice(0, 6) || '.bin';
      const file = path.join(ASSET_DIR, hash(target, 24) + ext);
      if (fs.existsSync(file)) continue;
      try {
        const r = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 GachaArchive/0.9' }, signal: AbortSignal.timeout(15000) });
        if (!r.ok) { failed.add(target); continue; }
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 12 * 1024 * 1024) { failed.add(target); continue; }
        await fsp.writeFile(file, buf);
      } catch { failed.add(target); }
    }
  };
  await Promise.all(Array.from({ length: 4 }, () => worker()));
  prefetching.delete(game);
}

export async function autoCheckCatalogs() {
  const results = [];
  for (const game of ['hsr', 'zzz']) {
    try {
      const result = await syncCatalog(game);
      results.push({ game, ...result });
    } catch (e) {
      results.push({ game, ok: false, error: e.message });
    }
  }
  prefetchAssets('genshin').catch(() => {});
  return results;
}

export function catalogPublic(game) {
  const catalog = loadCatalog(game);
  return {
    game,
    updatedAt: catalog.updatedAt,
    source: catalog.source,
    version: catalog.version,
    items: catalog.items.map((i) => ({
      id: i.id, name: i.name, type: i.type, rarity: i.rarity,
      iconUrl: i.iconUrl ? `/api/asset?game=${encodeURIComponent(game)}&u=${encodeURIComponent(i.iconUrl)}` : '',
      weaponType: i.weaponType || '', path: i.path || '', element: i.element || '',
    })),
  };
}
