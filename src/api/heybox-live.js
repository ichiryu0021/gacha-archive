import crypto from 'node:crypto';
import { getGame } from '../config.js';
import { parseHeyboxArknights } from './heybox.js';

const NAME_KEYS = ['name', 'charName', 'char_name', 'itemName', 'item_name', 'roleName', 'role_name', 'gachaName', 'gacha_name', 'rewardName', 'reward_name', 'lotteryName', 'lottery_name'];
const RARITY_KEYS = ['rarity', 'rank', 'rank_type', 'star', 'stars', 'quality', 'qualityLevel', 'rare', 'itemRarity', 'item_rarity'];
const TIME_KEYS = ['time', 'gachaTs', 'gacha_ts', 'timestamp', 'createTime', 'create_time', 'recordTime', 'record_time', 'lotteryTime', 'lottery_time', 'gachaTime', 'gacha_time'];
const POOL_KEYS = ['poolName', 'pool_name', 'gachaTypeName', 'gacha_type_name', 'pool', 'poolType', 'pool_type', 'gachaType', 'gacha_type', 'activityName'];
const PITY_KEYS = ['pity', 'pullCount', 'pull_count', 'gachaCount', 'gacha_count', 'drawCount', 'draw_count', 'count'];
const UP_KEYS = ['up', 'isUp', 'is_up', 'upFlag', 'up_flag', 'win'];

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return undefined;
}

function norm(value) {
  return String(value || '').replace(/[「」『』“”"\s·•]/g, '').trim();
}

function cnTime(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number' || /^\d{10,13}$/.test(String(value))) {
    let ms = Number(value);
    if (ms < 1e12) ms *= 1000;
    const d = new Date(ms + 8 * 3600 * 1000);
    if (Number.isFinite(d.getTime())) return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  const text = String(value).trim();
  const parsed = Date.parse(text.includes('T') ? text : text.replace(' ', 'T'));
  if (Number.isFinite(parsed)) {
    const d = new Date(parsed + 8 * 3600 * 1000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  return '';
}

function rarityNumber(value, gameId) {
  const game = getGame(gameId);
  const text = String(value || '').trim().toLowerCase();
  if (/^(s|s级|s rank|最高)$/.test(text)) return 5;
  if (/^(a|a级)$/.test(text)) return 4;
  if (/^(b|b级)$/.test(text)) return 3;
  if (/六星|6星/.test(text)) return 5;
  if (/五星|5星/.test(text)) return game.topRank === 6 ? 4 : 5;
  if (/四星|4星/.test(text)) return game.topRank === 6 ? 3 : 4;
  if (/三星|3星/.test(text)) return 3;
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  if (game.topRank === 6 && number >= 6) return 5;
  if (game.topRank === 6 && number === 5) return 4;
  if (game.topRank === 6 && number === 4) return 3;
  if (game.topRank === 5 && number >= 6) return 5;
  if (game.topRank === 5 && number >= 5) return 5;
  if (number === 4) return 4;
  if (number === 3) return 3;
  return 0;
}

function poolType(game, rawPool, rawType) {
  const type = String(rawType || '').trim();
  if ((game.types || []).includes(type)) return type;
  const pool = norm(rawPool);
  if (pool) {
    for (const [key, label] of Object.entries(game.pools || {})) {
      if (norm(label) && (pool.includes(norm(label)) || norm(label).includes(pool))) return key;
    }
  }
  return game.types?.[0] || 'other';
}

function upValue(value) {
  if (value === true || value === 1) return 'win';
  if (value === false || value === 0) return 'loss';
  const text = String(value || '').toLowerCase();
  if (['win', 'up', 'yes', 'true', '没歪'].includes(text)) return 'win';
  if (['loss', 'lose', 'miss', 'false', '歪'].includes(text)) return 'loss';
  return undefined;
}

function recordFromObject(gameId, obj, uid) {
  const game = getGame(gameId);
  const name = String(pick(obj, NAME_KEYS) || '').trim();
  if (!name || name.length > 60) return null;
  const rank = rarityNumber(pick(obj, RARITY_KEYS), gameId);
  if (rank !== 5) return null;
  const time = cnTime(pick(obj, TIME_KEYS));
  if (!time) return null;
  const rawPool = String(pick(obj, POOL_KEYS) || '').trim();
  const type = poolType(game, rawPool, pick(obj, ['gachaType', 'gacha_type', 'type']));
  const pityRaw = Number(pick(obj, PITY_KEYS));
  const pity = Number.isFinite(pityRaw) && pityRaw > 0 ? Math.min(999, Math.round(pityRaw)) : null;
  const up = upValue(pick(obj, UP_KEYS));
  const id = `heybox_${crypto.createHash('sha1').update(`${gameId}|${name}|${time}|${rawPool}|${pity ?? ''}`).digest('hex').slice(0, 20)}`;
  return {
    id,
    uid: String(uid || ''),
    gachaType: type,
    uigfType: type,
    count: 1,
    time,
    name,
    itemType: '角色',
    rank: 5,
    pity,
    poolName: rawPool || game.pools?.[type] || '小黑盒',
    source: 'heybox-live',
    synthetic: false,
    ...(up ? { up } : {}),
  };
}

function walk(value, gameId, out, state, depth = 0) {
  if (state.nodes++ > 30000 || depth > 12 || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, gameId, out, state, depth + 1);
    return;
  }
  if (typeof value !== 'object') return;
  const record = recordFromObject(gameId, value, state.uid);
  if (record) out.push(record);
  for (const key of Object.keys(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
    walk(value[key], gameId, out, state, depth + 1);
  }
}

function readUid(value) {
  if (!value || typeof value !== 'object') return '';
  for (const key of ['uid', 'game_uid', 'gameUid', 'role_uid', 'roleUid']) {
    if (value[key]) return String(value[key]);
  }
  return '';
}

function looksLikeArknights(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value).filter(([key]) => Number.isFinite(Number(key)));
  return entries.length > 0 && entries.every(([, item]) => item && Array.isArray(item.c));
}

export function extractHeyboxLive(gameId, responses) {
  const game = getGame(gameId);
  const records = [];
  const totals = { exact: 0, perType: {}, currentPity: {}, daily: {}, fetchedAt: new Date().toISOString() };
  const payloads = Array.isArray(responses) ? responses : [];
  let parsedPayloads = 0;
  let arknightsTotals = null;
  for (const response of payloads) {
    let json;
    try { json = JSON.parse(String(response?.body || '')); } catch { continue; }
    parsedPayloads++;
    if (gameId === 'arknights' && looksLikeArknights(json)) {
      try {
        const parsed = parseHeyboxArknights(json);
        records.push(...parsed.records);
        if (parsed.totals?.exact) arknightsTotals = parsed.totals;
        continue;
      } catch { /* fall through to generic walker */ }
    }
    const state = { nodes: 0, uid: readUid(json) || readUid(json?.data) };
    walk(json, gameId, records, state);
  }
  const seen = new Set();
  const unique = records.filter((record) => (seen.has(record.id) ? false : (seen.add(record.id), true)));
  if (arknightsTotals) {
    Object.assign(totals, arknightsTotals);
  } else {
    for (const record of unique) {
      totals.perType[record.gachaType] = totals.perType[record.gachaType] || { total: 0, five: 0 };
      totals.perType[record.gachaType].five++;
    }
    for (const response of payloads) {
      try {
        const json = JSON.parse(String(response?.body || ''));
        const candidates = [json?.total, json?.total_count, json?.totalPulls, json?.data?.total, json?.data?.total_count, json?.data?.lottery_total];
        for (const value of candidates) {
          const number = Number(value);
          if (Number.isFinite(number) && number > 0) totals.exact = Math.max(totals.exact, Math.round(number));
        }
      } catch { /* ignore malformed capture */ }
    }
  }
  return {
    game: gameId,
    records: unique,
    totals,
    payloads: parsedPayloads,
  };
}

export async function importHeyboxLive(store, gameId, responses) {
  const parsed = extractHeyboxLive(gameId, responses);
  if (!parsed.records.length) {
    throw new Error(`捕获到 ${parsed.payloads} 个 JSON，但没有识别出最高稀有度记录。请确认已登录小黑盒并打开对应游戏的抽卡/祈愿分析页面。`);
  }
  const merged = store.mergeRecords(gameId, parsed.records, { source: 'heybox-live' });
  if (parsed.totals.exact) store.setTotals(gameId, parsed.totals);
  await store.flush(true);
  return {
    game: gameId,
    imported: merged.added,
    totalChecked: parsed.records.length,
    totalPulls: parsed.totals.exact || 0,
    payloads: parsed.payloads,
    source: '小黑盒页面捕获',
  };
}
