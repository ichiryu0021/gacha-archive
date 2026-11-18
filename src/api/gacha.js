import crypto from 'node:crypto';
import { GAMES, getGame, isKnownHost } from '../config.js';
import { matchItem } from './catalog.js';
import { hash, maskSecret, sleep, uid } from '../utils.js';

const pending = new Map();
const PENDING_TTL = 2 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, item] of pending) if (now - item.createdAt > PENDING_TTL) pending.delete(id);
}, 10 * 60 * 1000).unref();

export function rememberSource(source) {
  const id = `lnk_${uid()}`;
  pending.set(id, { ...source, id, createdAt: Date.now() });
  return id;
}

export function getRememberedSource(id) {
  const item = pending.get(id);
  if (!item) return null;
  if (Date.now() - item.createdAt > PENDING_TTL) { pending.delete(id); return null; }
  return item;
}

export function pendingSummary(source) {
  return {
    linkId: source.linkId,
    game: source.game,
    gameName: GAMES[source.game]?.name || source.game,
    region: source.region || '',
    gameBiz: source.gameBiz || '',
    isOversea: Boolean(source.isOversea),
    preview: maskSecret(source.displayUrl || source.rawUrl || '', 'authkey'),
    source: source.source || 'manual',
    capturedAt: source.capturedAt || new Date().toISOString(),
  };
}

function detectGame(url) {
  const host = url.hostname.toLowerCase();
  const path = `${url.pathname}${url.search}`.toLowerCase();
  if (/hk4e/.test(host) || /hk4e/.test(path) || /init_type=(100|200|301|302|500)/.test(path)) return 'genshin';
  if (/hkrpg|starrail|star-rail/.test(host) || /hkrpg/.test(path) || /(^|&)gacha_type=(1|2|11|12|21|22)(&|$)/.test(path)) return 'hsr';
  if (/nap/.test(host) || /zenless|zzz/.test(path) || /real_gacha_type=/.test(path)) return 'zzz';
  const biz = url.searchParams.get('game_biz') || '';
  if (biz.startsWith('hk4e')) return 'genshin';
  if (biz.startsWith('hkrpg')) return 'hsr';
  if (biz.startsWith('nap')) return 'zzz';
  return null;
}

export function parseGachaLink(raw) {
  let text = String(raw || '').trim().replace(/^['"]|['"]$/g, '').replace(/&amp;/g, '&');
  if (!text) throw new Error('请粘贴完整的抽卡记录链接');
  if (!/^https?:\/\//i.test(text)) {
    if (/authkey=/.test(text)) text = `https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog?${text}`;
    else throw new Error('链接必须以 http:// 或 https:// 开头');
  }
  let url;
  try { url = new URL(text); } catch { throw new Error('无法解析这个链接，可能复制不完整'); }
  if (!isKnownHost(url.hostname)) throw new Error('只接受 mihoyo.com / hoyoverse.com 官方域名的链接');
  const gameId = detectGame(url);
  if (!gameId) throw new Error('无法识别这是哪款游戏的链接（原神/星铁/绝区零）');
  const game = getGame(gameId);
  const authkey = url.searchParams.get('authkey');
  if (!authkey) throw new Error('链接中没有 authkey。请重新打开游戏内抽卡历史页，或从导出工具复制完整链接。');
  if (authkey.length < 80) throw new Error('authkey 看起来不完整，请复制完整链接（通常超过 1000 个字符）');
  const isOversea = /hoyoverse\.com$/i.test(url.hostname) || /_global$/.test(url.searchParams.get('game_biz') || '') || /^os_/.test(url.searchParams.get('region') || '');
  const host = isOversea ? game.api.os : game.api.cn;
  const knownApi = /getGachaLog|getLdGachaLog/i.test(url.pathname);
  const apiHost = knownApi && /public-operation|hk4e-api|api-takumi/i.test(url.hostname) ? url.origin : host;
  const params = {};
  const keep = ['authkey', 'authkey_ver', 'sign_type', 'auth_appid', 'lang', 'game_biz', 'region', 'init_type', 'gacha_id', 'plat_type', 'device_type', 'timestamp'];
  for (const key of keep) {
    const v = url.searchParams.get(key);
    if (v !== null && v !== '') params[key] = v;
  }
  if (!params.authkey_ver) params.authkey_ver = '1';
  if (!params.sign_type) params.sign_type = '2';
  if (!params.auth_appid) params.auth_appid = 'webview_gacha';
  if (!params.lang) params.lang = 'zh-cn';
  if (!params.game_biz) params.game_biz = isOversea ? game.gameBiz.os : game.gameBiz.cn;
  const displayUrl = `${apiHost}${game.api.path}?${new URLSearchParams(params).toString()}`;
  const source = {
    game: gameId,
    apiHost,
    params,
    authkey,
    region: params.region || '',
    gameBiz: params.game_biz,
    lang: params.lang,
    isOversea,
    rawUrl: text,
    displayUrl,
    source: 'manual',
    capturedAt: new Date().toISOString(),
  };
  source.fingerprint = hash(`${gameId}|${authkey}|${params.region || ''}`, 20);
  return source;
}

export function describeSource(source) {
  return {
    ...pendingSummary(source),
    fingerprint: source.fingerprint,
  };
}

export function buildApiUrl(source, type, endId, pageSize = 20) {
  const game = getGame(source.game);
  const path = source.game === 'hsr' && ['21', '22'].includes(String(type))
    ? (game.api.ldPath || game.api.path)
    : game.api.path;
  const params = new URLSearchParams(source.params);
  params.set('authkey', source.authkey);
  params.delete('page');
  params.delete('size');
  params.delete('end_id');
  params.delete('gacha_type');
  params.delete('real_gacha_type');
  if (source.game === 'zzz') {
    params.set('real_gacha_type', String(type));
  } else {
    params.set(game.typeParam, String(type));
  }
  params.set('size', String(pageSize));
  params.set('page', '1');
  params.set('end_id', String(endId || '0'));
  return `${source.apiHost}${path}?${params.toString()}`;
}

function normalizeRecord(game, item, type) {
  const gachaType = String(item.gacha_type || type || '');
  const mapped = game.uigfMap[gachaType] || gachaType;
  let rank = Number(item.rank_type) || 0;
  let name = item.name || '';
  let itemType = item.item_type || '';
  if (game.id === 'zzz' && rank) {
    rank = rank >= 4 ? 5 : rank === 3 ? 4 : rank === 2 ? 3 : rank;
  }
  if (!rank || !itemType) {
    const m = matchItem(game.id, name);
    if (m.item) {
      rank = rank || m.item.rarity;
      itemType = itemType || m.item.type;
    }
  }
  return {
    id: String(item.id || ''),
    uid: String(item.uid || ''),
    gachaType,
    uigfType: mapped,
    itemId: String(item.item_id || ''),
    count: Number(item.count) || 1,
    time: String(item.time || ''),
    name,
    itemType,
    rank,
    lang: item.lang || 'zh-cn',
    poolName: game.pools[gachaType] || game.pools[mapped] || '未知卡池',
    source: 'official',
    synthetic: false,
  };
}

async function requestPage(source, type, endId) {
  const url = buildApiUrl(source, type, endId);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    Referer: source.isOversea ? 'https://act.hoyolab.com/' : 'https://webstatic.mihoyo.com/',
  };
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.retcode !== 0) {
        const msg = String(data.message || '');
        if ([ -101, -100 ].includes(Number(data.retcode)) || /authkey|login|登录/i.test(msg)) {
          const err = new Error('抽卡链接已过期或无效，请重新打开游戏内抽卡历史页获取新链接');
          err.code = 'AUTH_EXPIRED';
          throw err;
        }
        if (Number(data.retcode) === -110) {
          await sleep(1200 * (attempt + 1));
          lastError = new Error('请求过于频繁，已自动重试');
          continue;
        }
        const err = new Error(`官方接口返回 ${data.retcode}：${msg || '未知错误'}`);
        err.code = 'API_ERROR';
        throw err;
      }
      return data.data || {};
    } catch (e) {
      if (e.code === 'AUTH_EXPIRED') throw e;
      lastError = e;
      if (attempt < 2) await sleep(600 * (attempt + 1));
    }
  }
  throw lastError || new Error('请求官方接口失败');
}

export async function fetchAllRecords(source, options = {}) {
  const game = getGame(source.game);
  const types = options.types || game.types;
  const records = [];
  const errors = [];
  const typeResults = {};
  let meta = {};
  for (const type of types) {
    let endId = '0';
    let page = 0;
    let typeCount = 0;
    try {
      while (page < 100) {
        page++;
        const data = await requestPage(source, type, endId);
        if (!meta.uid && data.list?.length) {
          meta = {
            uid: data.list[0].uid || '',
            region: data.region || source.region || '',
            timezone: Number(data.region_time_zone ?? 8),
            gameBiz: source.gameBiz,
            lang: source.lang,
          };
        }
        const list = Array.isArray(data.list) ? data.list : [];
        if (!list.length) break;
        let newest = '';
        for (const item of list) {
          const rec = normalizeRecord(game, item, type);
          if (!rec.id) continue;
          if (!newest) newest = rec.id;
          records.push(rec);
          typeCount++;
        }
        const next = String(list[list.length - 1]?.id || '');
        if (!next || next === endId) break;
        endId = next;
        if (typeCount > 2000) throw new Error('该卡池记录异常多，已停止以防止请求失控');
        if (page < 100) await sleep(options.delay ?? 320);
      }
      typeResults[type] = { ok: true, count: typeCount };
    } catch (e) {
      typeResults[type] = { ok: false, count: typeCount, error: e.message, code: e.code || '' };
      errors.push({ type, pool: game.pools[type] || type, message: e.message, code: e.code || '' });
      if (e.code === 'AUTH_EXPIRED') break;
    }
  }
  if (!records.length && errors.length && errors.every((e) => e.code === 'AUTH_EXPIRED')) {
    const err = new Error(errors[0].message);
    err.code = 'AUTH_EXPIRED';
    throw err;
  }
  return { records, errors, typeResults, meta };
}

export function sourceFromAuthkey(gameId, authkey, extra = {}) {
  const game = getGame(gameId);
  const source = {
    game: gameId,
    apiHost: extra.isOversea ? game.api.os : game.api.cn,
    params: {
      authkey, authkey_ver: '1', sign_type: '2', auth_appid: 'webview_gacha',
      lang: extra.lang || 'zh-cn', game_biz: extra.gameBiz || (extra.isOversea ? game.gameBiz.os : game.gameBiz.cn),
      ...(extra.region ? { region: extra.region } : {}),
    },
    authkey,
    region: extra.region || '',
    gameBiz: extra.gameBiz || game.gameBiz.cn,
    lang: extra.lang || 'zh-cn',
    isOversea: Boolean(extra.isOversea),
    source: extra.source || 'miyoushe',
    displayUrl: `${extra.isOversea ? game.api.os : game.api.cn}${game.api.path}?authkey=***`,
    capturedAt: new Date().toISOString(),
  };
  source.fingerprint = hash(`${gameId}|${authkey}|${source.region}`, 20);
  return source;
}

export function makeSyntheticId(time, name, index = 0) {
  const digits = String(time || '').replace(/\D/g, '').padEnd(14, '0').slice(0, 14);
  const suffix = String(index + 1).padStart(4, '0');
  return `${digits}${suffix}`.slice(0, 18);
}

export function createPreviewFromScan(gameId, rawUrl, cachePath) {
  const source = parseGachaLink(rawUrl);
  source.source = 'webcache';
  source.cachePath = cachePath;
  const id = rememberSource(source);
  source.linkId = id;
  return pendingSummary(source);
}

export function summarizePullTotals(gameId, allRecords) {
  const game = getGame(gameId);
  const perType = {};
  const currentPity = {};
  const daily = {};
  for (const r of allRecords) {
    const type = String(r.gachaType || '0');
    const day = String(r.time || '').slice(0, 10);
    if (day) daily[`${day}|${type}`] = (daily[`${day}|${type}`] || 0) + 1;
    const key = game.uigfMap[type] || type;
    perType[type] = perType[type] || { total: 0, five: 0 };
    perType[type].total++;
    if (Number(r.rank) === 5) perType[type].five++;
    currentPity[key] = (currentPity[key] || 0) + 1;
    if (Number(r.rank) === 5) currentPity[key] = 0;
  }
  const sorted = [...allRecords].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  return { exact: allRecords.length, perType, currentPity, daily, start: sorted[0]?.time || null, end: sorted.at(-1)?.time || null, fetchedAt: new Date().toISOString() };
}

export function digestAuthkey(authkey) {
  return crypto.createHash('sha256').update(authkey).digest('hex').slice(0, 12);
}
