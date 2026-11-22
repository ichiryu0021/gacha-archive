import { getGame } from '../config.js';
import { datePart, monthPart, withinPeriod } from '../utils.js';
import { loadCatalog } from './catalog.js';
import { versionFor, versionOrder } from './versions.js';
import { inferBannerUp } from './banners.js';

function characterPools(gameId) {
  return new Set(getGame(gameId).characterPools || []);
}

function weaponPools(gameId) {
  return new Set(getGame(gameId).weaponPools || []);
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  const t1 = Date.parse(`${String(a).slice(0, 10)}T00:00:00+08:00`);
  const t2 = Date.parse(`${String(b).slice(0, 10)}T00:00:00+08:00`);
  return Math.max(0, Math.round((t2 - t1) / 86400000));
}

function mergeIntervals(intervals) {
  const sorted = intervals
    .filter((i) => i.start && i.end)
    .map((i) => ({ start: datePart(i.start), end: datePart(i.end), source: i.source }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const out = [];
  for (const cur of sorted) {
    const last = out[out.length - 1];
    if (last && cur.start <= last.end) last.end = last.end > cur.end ? last.end : cur.end;
    else out.push({ ...cur });
  }
  return out;
}

function rangesOverlap(a, b) {
  if (!a.start || !a.end || !b.start || !b.end) return false;
  return a.start <= b.end && b.start <= a.end;
}

function inferUp(gameId, record) {
  const game = getGame(gameId);
  if (record.rank !== 5 || game.inferUp === false) return null;
  const pool = String(record.uigfType || record.gachaType);
  if (!(game.limitedPools || []).includes(pool)) return null;
  const norm = (v) => String(v || '').replace(/[「」『』“”"]/g, '').trim();
  const standard = new Set([...(game.standard5 || []), ...(game.standardWeapons || []), ...(game.nonUp5 || [])].map(norm));
  const addedMap = new Map(Object.entries(game.standardAdded || {}).map(([name, date]) => [norm(name), date]));
  const addedVersionMap = new Map(Object.entries(game.standardAddedVersion || {}).map(([name, version]) => [norm(name), version]));
  const versionCmp = (a, b) => {
    const pa = String(a || '').split('.').map(Number);
    const pb = String(b || '').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    return 0;
  };
  const key = norm(record.name);
  if (standard.has(key)) {
    const added = addedMap.get(key);
    if (added && record.time && String(record.time).slice(0, 10) < added) return 'win';
    if (addedVersionMap.has(key)) {
      const recordVersion = record.version || versionFor(gameId, record.time);
      if (recordVersion && versionCmp(recordVersion, addedVersionMap.get(key)) < 0) return 'win';
    }
    return 'loss';
  }
  return 'win';
}

function poolLabel(game, type, account) {
  return account?.poolNames?.[type] || game.pools[type] || `卡池 ${type}`;
}

function slimRecord(r) {
  return {
    id: r.id, time: r.time, name: r.name, itemId: r.itemId, itemType: r.itemType,
    rank: r.rank, gachaType: r.gachaType, uigfType: r.uigfType,
    poolName: r.poolName, pity: r.pity, up: r.up, version: r.version || null,
    source: r.source, synthetic: r.synthetic, order: r.order ?? null,
  };
}

export function analyzeGame({ gameId, account, catalog }) {
  const game = getGame(gameId);
  const allStored = [...(account?.records || [])];
  const fiveExact = allStored
    .filter((r) => Number(r.rank) === 5)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const snapshots = [...(account?.snapshots || [])].sort((a, b) => String(a.periodStart || '').localeCompare(String(b.periodStart || '')));

  const totals = account?.totals || {};
  const allExactTotal = Math.max(0, Number(totals.exact) || 0);
  const exactTotal = allExactTotal;
  const hasExactTotals = exactTotal > 0;
  const perType = totals.perType || {};
  const currentPityStored = totals.currentPity || {};

  for (const r of fiveExact) {
    r.version = r.version || versionFor(gameId, r.time);
    if (r.up) continue;
    r.up = inferBannerUp(gameId, r) ?? inferUp(gameId, r) ?? null;
  }

  const limitedPoolSet = new Set(game.limitedPools || []);
  const charPoolSet = characterPools(gameId);
  const weaponPoolSet = weaponPools(gameId);
  const careerFive = fiveExact.filter((r) => limitedPoolSet.has(String(r.uigfType || r.gachaType)));
  const limitedEntries = Object.entries(perType).filter(([key]) => limitedPoolSet.has(String(key)));
  const careerPulls = limitedEntries.length
    ? limitedEntries.reduce((sum, [, n]) => sum + (Number(n?.total ?? n) || 0), 0)
    : (Object.keys(perType).length ? 0 : exactTotal);
  const sumPulls = (poolSet) => Object.entries(perType).reduce(
    (sum, [type, n]) => poolSet.has(String(type)) ? sum + (Number(n?.total ?? n) || 0) : sum,
    0,
  );
  const charPulls = sumPulls(charPoolSet);
  const weaponPulls = sumPulls(weaponPoolSet);
  const exactFive = fiveExact.length;
  // Character and weapon pools have separate pity/counters, so their 5-star
  // stats must never be combined: 50/50 hit rate only exists on character pools.
  const charFive = fiveExact.filter((r) => charPoolSet.has(String(r.uigfType || r.gachaType)));
  const weaponFive = fiveExact.filter((r) => weaponPoolSet.has(String(r.uigfType || r.gachaType)));
  const charUp = charFive.filter((r) => r.up === 'win').length;
  const charLoss = charFive.filter((r) => r.up === 'loss').length;
  const charDecided = charUp + charLoss;
  const fiveUp = charUp;
  const fiveLoss = charLoss;
  const decided = charDecided;
  const limitedFive = charUp;
  const standardFive = charLoss;
  // Average 5-star cost: every 5-star (including a lost 50/50) resets pity.
  // The old implementation only reset on UP wins, so losses were rolled into
  // the next win and produced impossible averages (e.g. >90 on a 90-pity pool).
  const averageFiveCost = (poolSet) => {
    const rows = fiveExact.filter((r) => poolSet.has(String(r.uigfType || r.gachaType)));
    const samples = rows.map((r) => Number(r.pity) || 0).filter((n) => n > 0);
    return {
      avg: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null,
      count: samples.length,
    };
  };
  const charCost = averageFiveCost(characterPools(gameId));
  const weaponCost = averageFiveCost(weaponPools(gameId));

  const officialFull = snapshots
    .filter((s) => s.fullHistory && s.totalPulls > 0)
    .sort((a, b) => (b.totalPulls || 0) - (a.totalPulls || 0))[0] || null;

  let selectedSnapshots = snapshots.filter((s) => s.totalPulls > 0);
  if (officialFull) {
    selectedSnapshots = selectedSnapshots.filter((s) => {
      if (s.id === officialFull.id) return true;
      const sStart = datePart(s.periodStart || game.launchDate);
      const sEnd = datePart(s.periodEnd || '9999-12-31');
      const fStart = datePart(officialFull.periodStart || game.launchDate);
      const fEnd = datePart(officialFull.periodEnd || '9999-12-31');
      return sEnd < fStart || sStart > fEnd;
    });
  }

  const firstCareer = careerFive[0]?.time || totals.start || account?.lastSync || null;
  const lastCareer = careerFive[careerFive.length - 1]?.time || totals.end || account?.lastSync || null;
  const firstExact = firstCareer;
  const lastExact = lastCareer;
  const exactRange = { start: datePart(firstExact || ''), end: datePart(lastExact || '') };
  const intervals = selectedSnapshots.map((s) => ({
    start: datePart(s.periodStart || game.launchDate),
    end: datePart(s.periodEnd || new Date().toISOString().slice(0, 10)),
    source: s.source,
  }));
  const mergedIntervals = mergeIntervals(intervals);
  const exactRangeForCoverage = { start: datePart(exactRange.start || ''), end: datePart(exactRange.end || '') };
  const combinedIntervals = mergeIntervals([...mergedIntervals, ...(exactTotal > 0 && exactRangeForCoverage.start ? [exactRangeForCoverage] : [])]);
  const inAnyInterval = (time) => mergedIntervals.some((i) => datePart(time) >= i.start && datePart(time) <= i.end);

  const overlaps = mergedIntervals.some((i) => rangesOverlap(i, exactRange));
  const snapPulls = selectedSnapshots.reduce((sum, s) => sum + (Number(s.totalPulls) || 0), 0);
  const snapFive = selectedSnapshots.reduce((sum, s) => sum + (Number(s.fiveStars) || 0), 0);

  let lifetimePulls;
  let lifetimeFive;
  if (officialFull) {
    lifetimePulls = Math.max(snapPulls, exactTotal);
    lifetimeFive = Math.max(snapFive, exactFive);
  } else if (overlaps) {
    lifetimePulls = Math.max(snapPulls, exactTotal);
    lifetimeFive = Math.max(snapFive, exactFive);
  } else {
    lifetimePulls = snapPulls + exactTotal;
    lifetimeFive = snapFive + exactFive;
  }
  if (!selectedSnapshots.length) {
    lifetimePulls = exactTotal;
    lifetimeFive = exactFive;
  }

  const fiveOverlap = fiveExact.filter((r) => inAnyInterval(r.time)).length;
  const overlapPulls = overlaps ? Math.min(snapPulls || exactTotal, exactTotal) : 0;

  const currentPityUnknown = Boolean(totals.currentPityUnknown);
  const primaryPityType = (() => {
    const first = game.limitedPools?.[0];
    return first ? (game.uigfMap[first] || first) : game.types[0];
  })();
  const currentPity = {};
  for (const pool of game.types) {
    const key = game.uigfMap[pool] || pool;
    if (currentPity[key] === undefined) currentPity[key] = Number(currentPityStored[key]) || 0;
  }
  const pitySums = {};
  for (const r of fiveExact) {
    const type = String(r.gachaType || '0');
    pitySums[type] = (pitySums[type] || 0) + (Number(r.pity) || 0);
  }
  for (const [type, stats] of Object.entries(perType)) {
    const key = game.uigfMap[type] || type;
    if (currentPityStored[key] === undefined) {
      currentPity[key] = Math.max(0, (Number(stats?.total) || 0) - (pitySums[type] || 0));
    }
  }
  for (const [key, value] of Object.entries(currentPityStored)) {
    if (currentPity[key] === undefined) currentPity[key] = Number(value) || 0;
  }
  const hasCurrentPity = !currentPityUnknown
    && (Object.keys(currentPityStored).length > 0 || Object.keys(pitySums).length > 0);
  const pityKinds = {};
  for (const [kind, set, pulls] of [
    ['character', charPoolSet, charPulls],
    ['weapon', weaponPoolSet, weaponPulls],
  ]) {
    const type = [...set][0];
    if (!type) continue;
    const key = game.uigfMap[type] || type;
    pityKinds[kind] = {
      type: key,
      label: poolLabel(game, type, account),
      value: Number(currentPity[key]) || 0,
      cap: game.pityCap?.[key] ?? game.pityCap?.[type] ?? 90,
      hasCurrent: hasCurrentPity && pulls > 0 && Object.prototype.hasOwnProperty.call(currentPity, key),
    };
  }

  const poolsMap = new Map();
  for (const type of game.types) {
    const uigf = game.uigfMap[type] || type;
    if (!poolsMap.has(uigf)) {
      poolsMap.set(uigf, {
        type: uigf,
        label: poolLabel(game, type, account),
        count: 0,
        five: 0,
        limited: 0,
        standard: 0,
        hitApplicable: false,
        lastFive: null,
        currentPity: Number(currentPity[uigf]) || 0,
      });
    }
  }
  for (const [type, n] of Object.entries(perType)) {
    const uigf = game.uigfMap[type] || type;
    if (!poolsMap.has(uigf)) poolsMap.set(uigf, { type: uigf, label: poolLabel(game, type, account), count: 0, five: 0, limited: 0, standard: 0, hitApplicable: false, lastFive: null, currentPity: 0 });
    poolsMap.get(uigf).count += Number(n?.total ?? n) || 0;
  }
  for (const r of fiveExact) {
    const uigf = r.uigfType || r.gachaType;
    if (!poolsMap.has(uigf)) poolsMap.set(uigf, { type: uigf, label: poolLabel(game, r.gachaType, account), count: 0, five: 0, limited: 0, standard: 0, hitApplicable: false, lastFive: null, currentPity: 0 });
    const p = poolsMap.get(uigf);
    p.five++;
    p.hitApplicable = charPoolSet.has(String(uigf));
    if (r.up === 'win') p.limited++;
    if (r.up === 'loss') p.standard++;
    p.lastFive = r;
  }
  const pools = [...poolsMap.values()].map((p) => ({
    ...p,
    rate: p.count ? p.five / p.count : (p.five ? null : 0),
    hitRate: p.hitApplicable && (p.limited + p.standard) ? p.limited / (p.limited + p.standard) : null,
    hitPerPull: p.hitApplicable && p.count ? p.limited / p.count : null,
    lastFive: p.lastFive ? slimRecord(p.lastFive) : null,
  }));

  const itemMap = new Map();
  for (const r of careerFive) {
    const entry = itemMap.get(r.name) || { name: r.name, rank: 5, count: 0, lastTime: r.time, itemId: r.itemId, type: r.itemType };
    entry.count++;
    if (r.time > entry.lastTime) entry.lastTime = r.time;
    itemMap.set(r.name, entry);
  }
  const fiveItems = [...itemMap.values()].sort((a, b) => b.count - a.count || b.lastTime.localeCompare(a.lastTime));

  const monthlyMap = new Map();
  for (const r of careerFive) {
    const m = monthPart(r.time);
    if (!m) continue;
    monthlyMap.set(m, (monthlyMap.get(m) || 0) + 1);
  }
  const monthly = [...monthlyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, five]) => ({ month, five }));
  const versionMap = new Map();
  for (const r of careerFive) {
    if (!r.version) continue;
    versionMap.set(r.version, (versionMap.get(r.version) || 0) + 1);
  }
  const order = versionOrder(gameId);
  const versions = [...versionMap.entries()]
    .sort((a, b) => (order.indexOf(a[0]) - order.indexOf(b[0])) || a[0].localeCompare(b[0]))
    .map(([label, five]) => ({ label, five }));
  const versionLabels = [...new Set([...order, ...versions.map((v) => v.label)])]
    .sort((a, b) => {
      const pa = a.split('.').map(Number); const pb = b.split('.').map(Number);
      return (pa[0] - pb[0]) || (pa[1] || 0) - (pb[1] || 0);
    });

  const buckets = [
    { label: '1–40', min: 1, max: 40, count: 0 },
    { label: '41–60', min: 41, max: 60, count: 0 },
    { label: '61–70', min: 61, max: 70, count: 0 },
    { label: '71–80', min: 71, max: 80, count: 0 },
    { label: '81+', min: 81, max: 999, count: 0 },
  ];
  for (const r of careerFive) {
    if (!r.pity) continue;
    const b = buckets.find((x) => r.pity >= x.min && r.pity <= x.max);
    if (b) b.count++;
  }

  const snapshotDetails = selectedSnapshots.map((s) => {
    const inside = fiveExact.filter((r) => withinPeriod(r.time, s.periodStart, s.periodEnd));
    return {
      ...s,
      exactFiveWithin: inside.length,
      overlapsExact: rangesOverlap({ start: datePart(s.periodStart || game.launchDate), end: datePart(s.periodEnd || '9999-12-31') }, exactRange),
    };
  });

  const coverageStart = [game.launchDate, exactRange.start, ...selectedSnapshots.map((s) => datePart(s.periodStart || ''))]
    .filter(Boolean).sort()[0] || game.launchDate;
  const coverageEnd = [new Date().toISOString().slice(0, 10), exactRange.end, ...selectedSnapshots.map((s) => datePart(s.periodEnd || ''))]
    .filter(Boolean).sort().at(-1);
  const launchToNow = Math.max(1, daysBetween(game.launchDate, new Date().toISOString().slice(0, 10)));
  const coveredDays = combinedIntervals.reduce((sum, i) => sum + Math.min(daysBetween(i.start, i.end) + 1, launchToNow), 0);
  const coveragePercent = Math.min(100, Math.round((coveredDays / launchToNow) * 100));

  const warnings = [];
  if (!fiveExact.length && !selectedSnapshots.length) warnings.push('还没有数据。可以自动读取本机链接，或先录入一个历史汇总。');
  if (!hasExactTotals && fiveExact.length) {
    warnings.push(selectedSnapshots.length
      ? '当前没有官方窗口总抽数，生涯总抽数来自历史汇总；官方近期数据只用于逐条五星与垫抽。'
      : '当前只有五星记录，没有总抽数。补录一份“历史汇总”或同步官方接口后，才能计算出金率与平均抽数。');
  }
  if (overlapPulls) warnings.push(`官方近期数据与历史汇总的时间段重叠，重叠约 ${overlapPulls} 抽；总抽数按较大值合并，避免重复计数。`);
  if (officialFull) warnings.push('绝区零官方全量统计提供总抽数与 S 级数量；逐条五星时间仍以近 6 个月接口为准。');
  if (totals.partial) warnings.push(totals.partialMessage || '官方接口只返回窗口内数据，总抽数不包含窗口外记录。');
  if (currentPityUnknown) warnings.push('当前数据源没有提供当前垫抽；垫抽显示为未知。');
  if (selectedSnapshots.some((s) => s.source === 'screenshot')) warnings.push('截图补录只保留五星行，非五星记录不会写入。');

  return {
    game: gameId,
    gameName: game.name,
    rarityLabel: game.rarityLabel || '五星',
    topRank: game.topRank || 5,
    mode: 'five-star-only',
    meta: account ? { uid: account.uid, nickname: account.nickname, region: account.region, lastSync: account.lastSync } : null,
    counts: {
      exact: allExactTotal,
      exactFive,
      charPulls,
      weaponPulls,
      charFive: charFive.length,
      weaponFive: weaponFive.length,
      limitedExact: charPulls,
      limitedFiveAll: charFive.length,
      lifetime: lifetimePulls,
      lifetimeFive,
      snapshotOnly: Math.max(0, lifetimePulls - exactTotal),
      overlap: overlapPulls,
      overlapFive: fiveOverlap,
      snapshotTotal: snapPulls,
      hasExactTotals,
      exactUnknown: Boolean(totals.exactUnknown),
      limitedFive,
      standardFive,
      fiveOnly: true,
    },
    rates: {
      five: lifetimePulls ? lifetimeFive / lifetimePulls : 0,
      exactFive: exactTotal ? exactFive / exactTotal : 0,
      avgPity: charCost.avg,
      exactAvgPity: charCost.avg,
      avgChar: charCost.avg,
      avgWeapon: weaponCost.avg,
      charSamples: charCost.count,
      weaponSamples: weaponCost.count,
      upPityCount: charCost.count,
      expectedFive: game.expectedFive?.['301'] || game.expectedFive?.['11'] || game.expectedFive?.['2'] || 62.5,
      upRate: charDecided ? charUp / charDecided : null,
      hitRateAll: charDecided ? charUp / charDecided : null,
      upWins: charUp, upLosses: charLoss, upDecided: charDecided,
      limitedFive, standardFive,
      limitedPerPull: charPulls ? charUp / charPulls : null,
    },
    pity: {
      current: currentPity,
      primary: primaryPityType,
      kinds: pityKinds,
      max: Math.max(0, ...Object.values(currentPity)),
      buckets,
      cap: game.pityCap,
      hasCurrent: hasCurrentPity,
      unknown: currentPityUnknown,
    },
    pools,
    monthly,
    versions,
    versionLabels,
    fiveItems,
    recentFive: [...careerFive].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 12).map(slimRecord),
    records: [...fiveExact].sort((a, b) => b.time.localeCompare(a.time)).map(slimRecord),
    snapshots: snapshotDetails,
    coverage: {
      start: coverageStart, end: coverageEnd, percent: coveragePercent,
      intervals: mergedIntervals, exactRange, launchDate: game.launchDate,
      officialWindow: game.officialWindow, hasOfficialFull: Boolean(officialFull),
    },
    officialPools: officialFull?.rawPools || null,
    warnings,
    catalog: { version: catalog?.version || '', updatedAt: catalog?.updatedAt || null, source: catalog?.source || '' },
    generatedAt: new Date().toISOString(),
  };
}

export function filterRecords(analysis, filters = {}) {
  let list = analysis.records;
  const pool = filters.pool && filters.pool !== 'all' ? String(filters.pool) : '';
  if (pool) list = list.filter((r) => String(r.uigfType) === pool || String(r.gachaType) === pool);
  if (filters.rarity && filters.rarity !== 'all' && String(filters.rarity) !== '5') list = [];
  if (filters.source && filters.source !== 'all') list = list.filter((r) => (r.source || 'official') === filters.source);
  if (filters.search) {
    const q = String(filters.search).toLowerCase();
    list = list.filter((r) => `${r.name} ${r.poolName} ${r.time}`.toLowerCase().includes(q));
  }
  if (filters.from) list = list.filter((r) => datePart(r.time) >= filters.from);
  if (filters.to) list = list.filter((r) => datePart(r.time) <= filters.to);
  return list;
}
