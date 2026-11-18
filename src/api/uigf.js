import { APP_VERSION, getGame } from '../config.js';
import { datePart, normalizeName, withinPeriod } from '../utils.js';

function inferGameFromList(list) {
  const types = new Set(list.map((r) => String(r.gacha_type || r.uigf_gacha_type || '')));
  if ([...types].some((t) => ['11', '12', '21', '22'].includes(t))) return 'hsr';
  if ([...types].some((t) => ['100', '200', '301', '302', '400', '500'].includes(t))) return 'genshin';
  if ([...types].some((t) => ['2', '3', '5', '102', '103'].includes(t))) return 'zzz';
  return 'genshin';
}

function normalizeImported(gameId, raw, uid, timezone = 8) {
  const game = getGame(gameId);
  const type = String(raw.gacha_type || raw.real_gacha_type || raw.uigf_gacha_type || '0');
  const uigfType = String(raw.uigf_gacha_type || game.uigfMap[type] || type);
  return {
    id: raw.id ? String(raw.id) : '',
    uid: String(raw.uid || uid || ''),
    gachaType: type,
    uigfType,
    itemId: String(raw.item_id || ''),
    count: Number(raw.count) || 1,
    time: String(raw.time || ''),
    name: String(raw.name || ''),
    itemType: String(raw.item_type || ''),
    rank: Number(raw.rank_type) || 0,
    lang: raw.lang || 'zh-cn',
    poolName: game.pools[type] || game.pools[uigfType] || '导入记录',
    source: 'uigf',
    synthetic: false,
  };
}

function computeTotals(game, all) {
  const perType = {};
  const currentPity = {};
  const daily = {};
  for (const r of all) {
    const day = String(r.time || '').slice(0, 10);
    if (day) daily[`${day}|${String(r.gachaType || r.gacha_type || '0')}`] = (daily[`${day}|${String(r.gachaType || r.gacha_type || '0')}`] || 0) + 1;
    const type = String(r.gachaType || r.gacha_type || '0');
    const key = game.uigfMap[type] || type;
    perType[type] = perType[type] || { total: 0, five: 0 };
    perType[type].total++;
    if (Number(r.rank) === 5) perType[type].five++;
    currentPity[key] = (currentPity[key] || 0) + 1;
    if (Number(r.rank) === 5) currentPity[key] = 0;
  }
  return { exact: all.length, perType, currentPity, daily, fetchedAt: new Date().toISOString() };
}

export function parseUigfPayload(payload) {
  const results = [];
  const push = (game, accounts) => {
    for (const acc of accounts || []) {
      const list = Array.isArray(acc.list) ? acc.list : [];
      if (!list.length) continue;
      const gameCfg = getGame(game);
      const normalized = list.map((r) => normalizeImported(game, r, acc.uid, acc.timezone ?? 8)).filter((r) => r.name || r.time);
      const allWithRank = normalized.map((r) => ({ ...r, rank: r.rank || 0 }));
      const five = allWithRank.filter((r) => r.rank === 5);
      results.push({
        game,
        uid: String(acc.uid || allWithRank[0]?.uid || ''),
        timezone: Number(acc.timezone ?? 8),
        lang: acc.lang || 'zh-cn',
        all: allWithRank,
        five,
        totals: computeTotals(gameCfg, allWithRank),
      });
    }
  };
  if (Array.isArray(payload?.hk4e)) push('genshin', payload.hk4e);
  if (Array.isArray(payload?.hkrpg)) push('hsr', payload.hkrpg);
  if (Array.isArray(payload?.nap)) push('zzz', payload.nap);
  if (!results.length && Array.isArray(payload?.list)) {
    const game = inferGameFromList(payload.list);
    push(game, [{ uid: payload.info?.uid || payload.uid, timezone: payload.info?.timezone ?? 8, lang: payload.info?.lang || 'zh-cn', list: payload.list }]);
  }
  if (!results.length && Array.isArray(payload?.data?.list)) {
    const game = inferGameFromList(payload.data.list);
    push(game, [{ uid: payload.data.uid || payload.info?.uid, timezone: payload.data.timezone ?? 8, list: payload.data.list }]);
  }
  if (!results.length) throw new Error('没有识别到 UIGF / SRGF 抽卡记录。支持 UIGF v4、UIGF v3、SRGF v1 JSON。');
  return results;
}

export async function importUigf(store, payload) {
  const parsed = parseUigfPayload(payload);
  const summary = [];
  for (const item of parsed) {
    const account = store.ensureAccount(item.game, {
      uid: item.uid, timezone: item.timezone, lang: item.lang,
    });
    const result = store.mergeRecords(item.game, item.five, {
      source: 'uigf',
      meta: { uid: item.uid, timezone: item.timezone, lang: item.lang },
      lastSource: 'uigf',
    });
    store.setTotals(item.game, item.totals);
    summary.push({
      game: item.game,
      gameName: getGame(item.game).name,
      uid: item.uid,
      importedFive: result.added,
      totalPulls: item.totals.exact,
      fiveStars: item.five.length,
      skippedNonFive: Math.max(0, item.all.length - item.five.length),
    });
  }
  await store.flush(true);
  return { summary };
}

function numericId(record, index) {
  if (record.id && /^\d{1,19}$/.test(String(record.id))) return String(record.id);
  const digits = String(record.time || '').replace(/\D/g, '').padEnd(14, '0').slice(0, 14);
  return `${digits}${String(index + 1).padStart(4, '0')}`.slice(0, 19);
}

export function buildUigf(gameId, account) {
  const game = getGame(gameId);
  const key = { genshin: 'hk4e', hsr: 'hkrpg', zzz: 'nap' }[gameId] || gameId;
  const records = [...(account?.records || [])]
    .filter((r) => Number(r.rank) === 5)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const list = records.map((r, i) => {
    const row = {
      uigf_gacha_type: String(r.uigfType || game.uigfMap[r.gachaType] || r.gachaType),
      gacha_type: String(r.gachaType),
      item_id: String(r.itemId || ''),
      count: String(r.count || 1),
      time: r.time,
      name: r.name,
      item_type: r.itemType || '角色',
      rank_type: String(r.rank || 5),
      id: numericId(r, i),
    };
    if (gameId !== 'genshin') row.gacha_id = String(r.gachaId || r.gachaType);
    if (r.synthetic) row._five_star_only_synthetic = true;
    return row;
  });
  const payload = {
    info: {
      export_timestamp: Math.floor(Date.now() / 1000),
      export_app: '星轨抽卡档案 / Gacha Archive',
      export_app_version: APP_VERSION,
      version: 'v4.2',
      five_star_only: true,
      note: '本文件只包含五星记录；总抽数保存在应用本地汇总中。',
    },
    [key]: [{
      uid: String(account?.uid || ''),
      timezone: Number(account?.timezone ?? 8),
      lang: account?.lang || 'zh-cn',
      list,
    }],
  };
  return payload;
}

export function buildCsv(account) {
  const rows = [['时间', '名称', '星级', '类型', '卡池', '保底抽数', 'UP结果', '来源', '记录ID']];
  for (const r of [...(account?.records || [])].sort((a, b) => String(b.time).localeCompare(String(a.time)))) {
    rows.push([
      r.time, r.name, r.rank, r.itemType, r.poolName, r.pity ?? '', r.up || '', r.source || 'official', r.id,
    ]);
  }
  return '\ufeff' + rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export function snapshotFromZzz(data) {
  const totalPulls = Number(data?.total_gacha_count) || 0;
  const fiveStars = Number(data?.total_s_count) || 0;
  const typeStats = Array.isArray(data?.type_stats) ? data.type_stats : [];
  const perType = {};
  for (const t of typeStats) {
    const type = String(t.gacha_type || t.type || '');
    perType[type] = {
      total: Number(t.total_count) || 0,
      five: Number(t.s_count) || 0,
      up: Number(t.up_count) || 0,
      avgUp: Number(t.new_s_max_times) || 0,
      current: Number(t.next_s_cur_times) || 0,
      label: t.type_name || t.name || '',
    };
  }
  return {
    source: 'zzz-official',
    title: '绝区零官方全量统计',
    periodStart: '2024-07-04',
    periodEnd: new Date().toISOString().slice(0, 10),
    totalPulls,
    fiveStars,
    fourStars: 0,
    perType,
    fiveStarItems: [],
    note: '米游社“调频统计工具”返回的官方全量汇总；不包含逐抽非五星记录。',
    fullHistory: true,
    rawPools: typeStats.slice(0, 20),
  };
}
