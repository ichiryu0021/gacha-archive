import crypto from 'node:crypto';
import { getGame } from '../config.js';

function cleanNteName(value) {
  return String(value || '').trim().replace(/^(角色|弧盘|道具|时装|滑翔翼|改装件)[·・.]\s*/u, '');
}

function cleanItemId(value) {
  const id = String(value || '').trim();
  return /^fork_/i.test(id) ? id.toLowerCase() : id;
}

function itemKind(record) {
  const id = cleanItemId(record.item_id ?? record.itemId);
  const name = String(record.item_name || record.name || '');
  if (/^fork_/i.test(id) || /^弧盘[·・.]/u.test(name)) return '弧盘';
  if (/^(道具|时装|滑翔翼|改装件)[·・.]/u.test(name)) return '其他';
  return '角色';
}

function poolKey(game, record) {
  const poolId = String(record.pool_id || '');
  const lottery = String(record.lottery_id || '');
  const name = String(record.pool_name || '');
  const text = `${poolId} ${lottery} ${name}`;
  if (/fork|weapon|弧盘|研募/i.test(text)) return 'weapon';
  if (/CardPool_NewRole|Permanent|常驻|标准/i.test(text)) return 'permanent';
  return 'limited';
}

function cleanTime(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const parsed = Date.parse(text.includes('T') ? text : text.replace(' ', 'T'));
  if (!Number.isFinite(parsed)) return text.slice(0, 19);
  const date = new Date(parsed + 8 * 3600 * 1000);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function parseNteExport(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('不是 NTE Gacha Exporter 导出文件');
  const list = payload?.nte?.list || payload?.list;
  if (!Array.isArray(list) || !list.length) throw new Error('没有找到 NTE 抽卡记录');
  const game = getGame('nte');
  const records = list
    .map((row, index) => ({ ...row, __index: index }))
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')) || Number(a.source_order || a.__index) - Number(b.source_order || b.__index));
  const rows = [];
  const perType = {};
  const poolPity = {};
  const daily = {};
  let exact = 0;
  let uid = '';
  for (const raw of records) {
    const count = Math.max(1, Number(raw.count) || 1);
    const pool = poolKey(game, raw);
    const kind = itemKind(raw);
    const time = cleanTime(raw.time);
    const name = cleanNteName(raw.item_name || raw.name);
    const rarity = Number(raw.rarity) || 0;
    if (!time || !name) continue;
    const day = time.slice(0, 10);
    perType[pool] = perType[pool] || { total: 0, five: 0 };
    perType[pool].total += count;
    daily[`${day}|${pool}`] = (daily[`${day}|${pool}`] || 0) + count;
    poolPity[pool] = (poolPity[pool] || 0) + count;
    exact += count;
    if (!uid && raw.uid) uid = String(raw.uid);
    if (rarity !== 5) continue;
    const pity = poolPity[pool];
    if (kind === '角色' || kind === '弧盘') {
      perType[pool].five++;
      const type = kind === '弧盘' ? 'weapon' : pool;
      const key = `${type}|${pool}|${name}|${time}|${pity}`;
      rows.push({
        id: `nteexport_${crypto.createHash('sha1').update(key).digest('hex').slice(0, 24)}`,
        uid,
        gachaType: type,
        uigfType: type,
        poolType: pool,
        itemId: cleanItemId(raw.item_id || raw.itemId),
        itemType: kind,
        count: 1,
        time,
        name,
        rank: 5,
        rarity: 5,
        pity,
        poolName: String(raw.pool_name || game.pools[pool] || ''),
        up: null,
        source: 'nte-export',
        synthetic: false,
      });
    }
    poolPity[pool] = 0;
  }
  if (!exact) throw new Error('NTE 导出文件没有可用抽卡记录');
  return {
    records: rows.reverse(),
    totals: {
      exact,
      coverage: exact,
      exactUnknown: false,
      full: true,
      perType,
      currentPity: poolPity,
      currentPityUnknown: false,
      daily,
      start: records[0] ? cleanTime(records[0].time) : null,
      end: records[records.length - 1] ? cleanTime(records[records.length - 1].time) : null,
      fetchedAt: new Date().toISOString(),
    },
    totalPulls: exact,
    topCount: rows.length,
  };
}

/**
 * Older imports put arc discs (and occasionally items) into character pools.
 * Normalize names, split weapons out of character pools, and collapse the
 * duplicates created by the old prefixed names.
 */
export function repairNteAccount(store) {
  const account = store.account('nte');
  if (!account?.records?.length) return { changed: false, records: 0 };
  const oldRecords = account.records;
  const before = oldRecords.length;
  const picked = new Map();
  for (const record of account.records) {
    const name = cleanNteName(record.name);
    const kind = itemKind(record);
    if (!name || kind === '其他') continue;
    const type = kind === '弧盘' ? 'weapon' : String(record.gachaType || record.uigfType || 'limited');
    const clean = {
      ...record,
      name,
      itemId: cleanItemId(record.itemId || record.item_id),
      itemType: kind,
      gachaType: type,
      uigfType: type,
      poolType: record.poolType || record.gachaType || type,
    };
    const key = `${type}|${name}|${clean.time}|${clean.itemId || ''}`;
    const old = picked.get(key);
    if (!old) {
      picked.set(key, clean);
      continue;
    }
    const score = (r) => (r.source === 'nte-export' ? 4 : r.source === 'official' ? 3 : 1) + (r.up ? 1 : 0);
    if (score(clean) > score(old)) picked.set(key, clean);
  }
  const records = [...picked.values()].sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
  account.records = records;
  if (account.totals) {
    const perType = { ...(account.totals.perType || {}) };
    for (const [type, stats] of Object.entries(perType)) {
      stats.five = records.filter((r) => r.gachaType === type).length;
    }
    for (const type of ['limited', 'permanent', 'weapon']) {
      perType[type] = perType[type] || { total: 0, five: 0 };
      perType[type].five = records.filter((r) => r.gachaType === type).length;
    }
    account.totals.perType = perType;
    if (account.totals.full) {
      account.totals.exactUnknown = false;
      account.totals.partial = false;
      account.totals.partialMessage = '';
      account.totals.window = false;
    }
    if (account.totals.currentPity || account.totals.full) {
      account.totals.currentPityUnknown = false;
    }
  }
  const changed = records.length !== before || records.some((r, i) => r.name !== oldRecords[i]?.name || r.gachaType !== oldRecords[i]?.gachaType);
  if (changed) store.touch();
  return { changed, records: records.length, removed: before - records.length };
}

function recordKey(record) {
  return `${record.gachaType || record.uigfType}|${cleanNteName(record.name)}|${record.time}|${cleanItemId(record.itemId)}`;
}

export async function importNteExport(store, payload) {
  const parsed = parseNteExport(payload);
  const account = store.account('nte');
  repairNteAccount(store);
  const existing = new Set((account?.records || []).map(recordKey));
  const records = parsed.records
    .filter((r) => !existing.has(recordKey(r)))
    .map((r) => ({ ...r, uid: r.uid || account?.uid || '' }));
  const merged = store.mergeRecords('nte', records, { source: 'nte-export' });
  store.setTotals('nte', { ...parsed.totals, replaceFull: true });
  repairNteAccount(store);
  await store.flush(true);
  return {
    game: 'nte',
    imported: merged.added,
    totalPulls: parsed.totalPulls,
    topCount: parsed.topCount,
    source: 'NTE Gacha Exporter',
  };
}
