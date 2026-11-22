import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { ASSET_DIR, DATA_DIR, GAME_IDS, ROOT, isAllowedAssetHost } from '../config.js';
import { buildArknightsCatalog, buildEndfieldCatalog, buildNteCatalog } from './catalog-thirdparty.js';
import { hash, normalizeName, similarity, writeJsonAtomic } from '../utils.js';

const CATALOG_FILES = Object.fromEntries(GAME_IDS.map((g) => [g, path.join(DATA_DIR, `catalog-${g}.json`)]));
const HSR_WIKI = 'https://sg-act-public-api.hoyolab.com/hoyowiki/hsr/wapi/get_entry_page_list';
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
  try { raw = JSON.parse(fs.readFileSync(CATALOG_FILES[game], 'utf8')); } catch {
    try { raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', `catalog-${game}.json`), 'utf8')); } catch {}
  }
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

async function fetchHsrWiki(menuId) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(HSR_WIKI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rpc-language': 'zh-cn',
        'x-rpc-wiki_app': 'hsr',
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

function hsrRarity(item, key) {
  const value = item.filter_values?.[key]?.values?.[0] || '';
  const map = { '五星': 5, '四星': 4, '三星': 3 };
  return map[value] || 4;
}

async function syncHsr() {
  const [chars, cones] = await Promise.all([fetchHsrWiki(104), fetchHsrWiki(107)]);
  const items = [];
  for (const item of chars) {
    const parts = String(item.name || '').split(/[•·]/).filter(Boolean);
    items.push({
      id: String(item.entry_page_id || ''), name: item.name, aliases: parts.length > 1 ? parts : [],
      type: '角色', rarity: hsrRarity(item, 'character_rarity'), iconUrl: item.icon_url || '',
      path: item.filter_values?.character_paths?.values?.[0] || '',
      element: item.filter_values?.character_combat_type?.values?.[0] || '',
    });
  }
  for (const item of cones) {
    items.push({
      id: String(item.entry_page_id || ''), name: item.name,
      type: '光锥', rarity: hsrRarity(item, 'equipment_rarity'), iconUrl: item.icon_url || '',
      path: item.filter_values?.equipment_paths?.values?.[0] || '',
    });
  }
  return {
    game: 'hsr', version: 'official-wiki', source: 'HoYoWiki (official)', updatedAt: new Date().toISOString(),
    items: items.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
  };
}

async function syncZzz() {
  const [agents, engines, bangboo] = await Promise.all([fetchZzzWiki(8), fetchZzzWiki(11), fetchZzzWiki(15)]);
  const items = [];
  for (const item of agents) {
    const rarity = item.filter_values?.agent_rarity?.values?.[0] === 'S' ? 5 : 4;
    const parts = item.name.split('·');
    const aliases = [...new Set([...parts, ...(item.name === '亚历山德丽娜·莎芭丝缇安' ? ['丽娜'] : []), ...(item.name === '猫宫又奈' ? ['猫又'] : [])])].filter((v) => v && v !== item.name);
    items.push({ id: String(item.entry_page_id || ''), name: item.name, aliases, type: '代理人', rarity, iconUrl: item.icon_url || '', element: item.filter_values?.agent_stats?.values?.[0] || '' });
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
  const thirdPartyBuilder = {
    arknights: buildArknightsCatalog,
    endfield: buildEndfieldCatalog,
    nte: buildNteCatalog,
  }[game];
  const data = thirdPartyBuilder
    ? await thirdPartyBuilder()
    : game === 'hsr' ? await syncHsr() : game === 'zzz' ? await syncZzz() : null;
  if (!data) throw new Error('不支持的游戏');
  if (!data.items.length) throw new Error('数据源返回为空');
  const current = loadCatalog(game);
  const same = current.items.length === data.items.length && JSON.stringify(current.items) === JSON.stringify(data.items);
  if (same) {
    if (!fs.existsSync(CATALOG_FILES[game])) await writeJsonAtomic(CATALOG_FILES[game], data);
    if (!['arknights', 'endfield', 'nte'].includes(game)) prefetchAssets(game).catch(() => {});
    return { ok: true, mode: 'cached', count: current.items.length, updatedAt: current.updatedAt, source: current.source };
  }
  await writeJsonAtomic(CATALOG_FILES[game], data);
  cache.delete(game);
  loadCatalog(game);
  if (!['arknights', 'endfield', 'nte'].includes(game)) prefetchAssets(game).catch(() => {});
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

async function catalogStale(game, days = 7) {
  try {
    const stat = await fsp.stat(CATALOG_FILES[game]);
    return Date.now() - stat.mtimeMs > days * 86400000;
  } catch {
    return true;
  }
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
  for (const game of ['arknights', 'endfield', 'nte']) {
    if (!(await catalogStale(game))) {
      results.push({ game, ok: true, mode: 'cached', message: '图鉴 7 天内已更新' });
      continue;
    }
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

function genshinIcon(i) {
  if (!i.icon) return i.iconUrl || '';
  // 官方 upload-bbs 对较新的角色/武器会返回 55633 字节的占位图；
  // Enka 的 UI 目录仍在更新，作为主源，原官方地址作为代理回退。
  return `https://enka.network/ui/${i.icon}.png`;
}

export function catalogPublic(game) {
  const catalog = loadCatalog(game);
  const directAssets = ['arknights', 'endfield', 'nte'].includes(game);
  return {
    game,
    updatedAt: catalog.updatedAt,
    source: catalog.source,
    version: catalog.version,
    items: catalog.items.map((i) => {
      const primary = game === 'genshin' && (i.type === '角色' || i.type === '武器')
        ? genshinIcon(i)
        : i.iconUrl;
      const fallback = game === 'genshin' && i.iconUrl && i.iconUrl !== primary ? i.iconUrl : '';
      const proxy = primary
        ? `/api/asset?game=${encodeURIComponent(game)}&u=${encodeURIComponent(primary)}${fallback ? `&fallback=${encodeURIComponent(fallback)}` : ''}`
        : '';
      return {
        id: i.id, name: i.name, type: i.type, rarity: i.rarity,
        // 第三方图鉴的图片源支持跨域直连，直连可以让浏览器并行加载，避免代理串行等待。
        iconUrl: primary ? (directAssets ? primary : proxy) : '',
        iconFallback: fallback,
        weaponType: i.weaponType || '', path: i.path || '', element: i.element || '', aliases: i.aliases || [],
      };
    }),
  };
}
