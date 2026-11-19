import { getGame } from '../config.js';
import { buildUigf } from './uigf.js';
import { bannersFor } from './banners.js';

const ARKNIGHTS_POOL_MAP = {
  限定寻访: 'limited',
  标准寻访: 'standard',
  中坚寻访: 'kernel',
  联动寻访: 'collab',
};

function formatCnTime(seconds) {
  const value = Number(seconds) > 1e12 ? Number(seconds) : Number(seconds) * 1000;
  const date = new Date(value + 8 * 3600 * 1000);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function arknightPoolKey(name) {
  const text = String(name || '');
  const banner = bannersFor('arknights').find((item) => text && (text.includes(item.name) || (item.aliases || []).some((alias) => text.includes(alias))));
  if (banner?.type) return banner.type;
  if (ARKNIGHTS_POOL_MAP[text]) return ARKNIGHTS_POOL_MAP[text];
  if (/限定/.test(text)) return 'limited';
  if (/中坚/.test(text)) return 'kernel';
  if (/联动/.test(text)) return 'collab';
  if (/标准/.test(text)) return 'standard';
  return 'other';
}

export function parseHeyboxArknights(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('不是小黑盒明日方舟导出格式');
  }
  const root = Array.isArray(payload)
    ? Object.fromEntries(payload.map((entry) => [entry.timestamp ?? entry.time, entry]))
    : (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : payload);
  const entries = Object.entries(root)
    .filter(([key, value]) => value && Array.isArray(value.c) && Number.isFinite(Number(key)))
    .sort(([a], [b]) => Number(a) - Number(b));
  if (!entries.length) throw new Error('没有识别到小黑盒寻访记录');

  const records = [];
  const perType = {};
  const currentPity = {};
  const daily = {};
  let topCount = 0;
  for (const [timestamp, entry] of entries) {
    const poolName = String(entry.p || '寻访');
    const poolKey = arknightPoolKey(poolName);
    const time = formatCnTime(timestamp);
    const day = time.slice(0, 10);
    perType[poolKey] = perType[poolKey] || { total: 0, five: 0 };
    currentPity[poolKey] = currentPity[poolKey] || 0;
    const items = Array.isArray(entry.c) && entry.c.length && !Array.isArray(entry.c[0]) ? [entry.c] : entry.c;
    for (const item of items || []) {
      const name = Array.isArray(item) ? String(item[0] || '') : String(item?.name || '');
      const rarity = Number(Array.isArray(item) ? item[1] : item?.rarity) || 0;
      if (!name) continue;
      perType[poolKey].total++;
      daily[`${day}|${poolKey}`] = (daily[`${day}|${poolKey}`] || 0) + 1;
      currentPity[poolKey]++;
      if (rarity !== 6) continue;
      perType[poolKey].five++;
      topCount++;
      records.push({
        id: '',
        uid: '',
        gachaType: poolKey,
        uigfType: poolKey,
        count: 1,
        time,
        name,
        itemType: '角色',
        rank: 5,
        pity: currentPity[poolKey],
        poolName,
        source: 'heybox',
        synthetic: false,
      });
      currentPity[poolKey] = 0;
    }
  }
  return {
    records,
    totals: {
      exact: Object.values(perType).reduce((sum, item) => sum + item.total, 0),
      perType,
      currentPity,
      daily,
      start: entries.length ? formatCnTime(entries[0][0]) : null,
      end: entries.length ? formatCnTime(entries[entries.length - 1][0]) : null,
      fetchedAt: new Date().toISOString(),
    },
    topCount,
  };
}

export async function importHeybox(store, payload) {
  const parsed = parseHeyboxArknights(payload);
  const merged = store.mergeRecords('arknights', parsed.records, { source: 'heybox' });
  store.setTotals('arknights', parsed.totals);
  const poolNames = {};
  for (const record of parsed.records) poolNames[record.gachaType] = record.poolName;
  store.setPoolNames('arknights', poolNames);
  await store.flush(true);
  return {
    game: 'arknights',
    imported: merged.added,
    totalPulls: parsed.totals.exact,
    fiveStars: parsed.records.length,
    topCount: parsed.topCount,
  };
}

export const HEYBOX_GAMES = ['genshin', 'hsr', 'zzz', 'arknights'];

function unixSeconds(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  const withZone = /[zZ]|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}+08:00`;
  const time = Date.parse(withZone);
  return Number.isFinite(time) ? Math.floor(time / 1000) : 0;
}

function arknightPools(game, record) {
  return record.poolName || game.pools[record.gachaType] || game.pools[record.uigfType] || '寻访';
}

// 小黑盒明日方舟导入格式：{ "<unix 秒>": { "c": [["名称", 星级, 是否新]], "p": "卡池" } }
// 本工具按设计只保存六星和 UP/歪，导出粒度与本地档案一致，不补全完整流水。
export function buildArknightsHeybox(account) {
  const game = getGame('arknights');
  const payload = {};
  for (const record of account?.records || []) {
    if (Number(record.rank) !== 5) continue;
    const time = unixSeconds(record.time);
    if (!time || !record.name) continue;
    const key = String(time);
    const pool = arknightPools(game, record);
    if (!payload[key]) payload[key] = { c: [], p: pool };
    payload[key].c.push([record.name, 6, false]);
    if (record.up === 'win' || record.up === 'loss') payload[key].up = record.up;
    if (record.pity) payload[key].pity = Number(record.pity);
  }
  return payload;
}

function withUpFields(payload, account) {
  const records = (account?.records || []).filter((r) => Number(r.rank) === 5);
  const byKey = new Map(records.map((r) => [`${r.time}|${r.name}`, r]));
  for (const group of Object.values(payload || {})) {
    const accounts = Array.isArray(group) ? group : Object.values(group || {}).filter((v) => v && Array.isArray(v.list));
    for (const account of accounts) {
      for (const row of account.list || []) {
        const record = byKey.get(`${row.time}|${row.name}`);
        if (!record) continue;
        if (record.up === 'win' || record.up === 'loss') row.up = record.up;
        if (record.pity) row.pity = Number(record.pity);
      }
    }
  }
  return payload;
}

export function buildHeybox(gameId, account) {
  if (!HEYBOX_GAMES.includes(gameId)) {
    throw new Error('小黑盒目前没有公开的该游戏导入格式');
  }
  if (gameId === 'arknights') return buildArknightsHeybox(account);
  // 原神的小黑盒祈愿分析支持 UIGF；星铁/绝区零也先复用 UIGF，能否识别取决于小黑盒版本。
  return withUpFields(buildUigf(gameId, account), account);
}
