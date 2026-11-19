import { cnTime } from './thirdparty.js';

const POOL_NAMES = {
  limited: '限定卡池',
  permanent: '常驻卡池',
  weapon: '弧盘池',
};

function asRecords(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Array.isArray(value.records) ? value.records : [];
}

export function parseNteuidPayload(payload, existingNames = new Map()) {
  const data = payload?.data && !payload.pools ? payload.data : payload;
  if (!data || typeof data !== 'object') throw new Error('NTEUID 内容不是对象');
  if (data.format && data.format !== 'nteuid-gacha') throw new Error(`不支持的 NTEUID 格式：${data.format}`);
  const uid = String(data.uid || '').trim();
  if (!/^\d+$/.test(uid)) throw new Error('NTEUID 缺少有效的游戏 UID');
  const pools = data.pools;
  if (!pools || typeof pools !== 'object') throw new Error('NTEUID 缺少 pools');
  const records = [];
  const perType = {};
  let exact = 0;
  let start = null;
  let end = null;
  for (const type of ['limited', 'permanent', 'weapon']) {
    const list = asRecords(pools[type]);
    perType[type] = { total: 0, five: 0 };
    for (const raw of list) {
      const itemId = String(raw.item_id || raw.itemId || '');
      const timeMs = Number(raw.time_ms ?? raw.timeMs) || 0;
      const pity = Number(raw.pity) || 0;
      if (!itemId || !timeMs || pity < 1) continue;
      const time = cnTime(timeMs);
      if (!time) continue;
      const resolved = existingNames.get(itemId);
      const itemType = type === 'weapon' ? '弧盘' : '角色';
      const name = String(resolved || `${itemType} ${itemId}`);
      records.push({
        id: `nteuid_${uid}_${type}_${itemId}_${timeMs}_${pity}`,
        uid,
        gachaType: type,
        uigfType: type,
        itemId,
        itemType,
        count: 1,
        time,
        name,
        nameIsFallback: !resolved,
        rank: 5,
        rarity: 5,
        pity,
        poolName: POOL_NAMES[type],
        up: null,
        source: 'nteuid',
        synthetic: false,
      });
      perType[type].total += pity;
      perType[type].five++;
      exact += pity;
      if (!start || time < start) start = time;
      if (!end || time > end) end = time;
    }
  }
  if (!records.length) throw new Error('NTEUID 里没有可导入的 S 级记录');
  records.sort((a, b) => b.time.localeCompare(a.time));
  return {
    game: 'nte',
    uid,
    records,
    poolNames: { ...POOL_NAMES },
    totals: {
      exact,
      perType,
      currentPity: {},
      currentPityUnknown: true,
      start,
      end,
      partial: true,
      partialMessage: 'NTEUID 只保存已出 S 的区间抽数，未出 S 的垫抽不在文件里。',
      fetchedAt: new Date().toISOString(),
    },
  };
}

export async function importNteuid(store, payload) {
  const existing = store.account('nte');
  const existingNames = new Map();
  for (const record of existing?.records || []) {
    if (record.itemId && record.name && !record.nameIsFallback) existingNames.set(String(record.itemId), record.name);
  }
  const parsed = parseNteuidPayload(payload, existingNames);
  const merged = store.mergeRecords('nte', parsed.records, {
    source: 'nteuid',
    meta: { uid: parsed.uid },
    lastSource: 'nteuid',
  });
  const previousExact = Number(existing?.totals?.exact) || 0;
  if (parsed.totals.exact >= previousExact) store.setWindowTotals('nte', parsed.totals);
  store.setPoolNames('nte', parsed.poolNames);
  return {
    ...merged,
    uid: parsed.uid,
    imported: parsed.records.length,
    totalPulls: parsed.totals.exact,
  };
}
