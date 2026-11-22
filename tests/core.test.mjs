import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGachaLink, buildApiUrl, sourceFromAuthkey, summarizePullTotals } from '../src/api/gacha.js';
import { parseUigfPayload, buildUigf, snapshotFromZzz } from '../src/api/uigf.js';
import { analyzeGame } from '../src/api/analyze.js';
import { loadCatalog, matchItem } from '../src/api/catalog.js';
import { Store } from '../src/store.js';
import { __test as tp } from '../src/api/thirdparty.js';
import { parseNteuidPayload } from '../src/api/nteuid.js';
import { buildArknightsHeybox, buildHeybox, parseHeyboxArknights } from '../src/api/heybox.js';
import { inferBannerUp } from '../src/api/banners.js';
import { extractHeyboxLive } from '../src/api/heybox-live.js';
import { parseNteExport } from '../src/api/nte-export.js';

const KEY = 'A'.repeat(120) + 'xyz';

function link(host, path, params) {
  return `https://${host}${path}?${new URLSearchParams(params).toString()}`;
}

test('parses Genshin webview URL and builds gacha API request', () => {
  const url = link('webstatic.mihoyo.com', '/hk4e/event/e20190909gacha/index.html', {
    authkey: KEY, authkey_ver: '1', sign_type: '2', auth_appid: 'webview_gacha',
    game_biz: 'hk4e_cn', region: 'cn_gf01', lang: 'zh-cn', init_type: '301',
  });
  const source = parseGachaLink(url);
  assert.equal(source.game, 'genshin');
  assert.equal(source.apiHost, 'https://public-operation-hk4e.mihoyo.com');
  assert.equal(source.authkey, KEY);
  const api = new URL(buildApiUrl(source, '302', '123'));
  assert.equal(api.pathname, '/gacha_info/api/getGachaLog');
  assert.equal(api.searchParams.get('gacha_type'), '302');
  assert.equal(api.searchParams.get('end_id'), '123');
  assert.equal(api.searchParams.get('size'), '20');
  assert.equal(api.searchParams.get('authkey'), KEY);
});

test('HSR collaboration pools use getLdGachaLog and ZZZ uses real_gacha_type', () => {
  const hsr = parseGachaLink(link('public-operation-hkrpg.mihoyo.com', '/common/hkrpg_gacha_record/api/getGachaLog', {
    authkey: KEY, authkey_ver: '1', sign_type: '2', auth_appid: 'webview_gacha',
    game_biz: 'hkrpg_cn', lang: 'zh-cn', gacha_type: '11',
  }));
  assert.match(buildApiUrl(hsr, '21', '0'), /getLdGachaLog/);
  assert.match(buildApiUrl(hsr, '11', '0'), /getGachaLog/);

  const zzz = parseGachaLink(link('public-operation-nap.mihoyo.com', '/common/gacha_record/api/getGachaLog', {
    authkey: KEY, authkey_ver: '1', sign_type: '2', auth_appid: 'webview_gacha',
    game_biz: 'nap_cn', lang: 'zh-cn', real_gacha_type: '2',
  }));
  const zzzUrl = new URL(buildApiUrl(zzz, '2', '0'));
  assert.equal(zzzUrl.searchParams.get('real_gacha_type'), '2');
  assert.equal(zzzUrl.searchParams.get('gacha_type'), null);
});

test('summarizer computes total and current pity from a full sequence', () => {
  const rows = [
    { gachaType: '11', uigfType: '11', rank: 5, time: '2025-01-01 00:00:00' },
    { gachaType: '11', uigfType: '11', rank: 3, time: '2025-01-02 00:00:00' },
    { gachaType: '11', uigfType: '11', rank: 4, time: '2025-01-03 00:00:00' },
    { gachaType: '11', uigfType: '11', rank: 5, time: '2025-01-04 00:00:00' },
  ];
  const totals = summarizePullTotals('hsr', rows);
  assert.equal(totals.exact, 4);
  assert.equal(totals.perType['11'].five, 2);
  assert.equal(totals.currentPity['11'], 0);
  assert.equal(totals.start, '2025-01-01 00:00:00');
  assert.equal(totals.end, '2025-01-04 00:00:00');
});

test('UIGF import keeps five-star records but totals include all pulls', () => {
  const payload = {
    info: { export_timestamp: 1, export_app: 't', export_app_version: '1', version: 'v4.2' },
    hk4e: [{ uid: '100000001', timezone: 8, list: [
      { uigf_gacha_type: '301', gacha_type: '301', item_id: '1', time: '2025-01-01 00:00:00', name: '刻晴', rank_type: '5', id: '1' },
      { uigf_gacha_type: '301', gacha_type: '301', item_id: '2', time: '2025-01-01 00:00:01', name: '班尼特', rank_type: '4', id: '2' },
      { uigf_gacha_type: '302', gacha_type: '302', item_id: '3', time: '2025-01-02 00:00:00', name: '天空之刃', rank_type: '5', id: '3' },
    ] }],
  };
  const parsed = parseUigfPayload(payload);
  assert.equal(parsed[0].game, 'genshin');
  assert.equal(parsed[0].all.length, 3);
  assert.equal(parsed[0].five.length, 2);
  assert.equal(parsed[0].totals.exact, 3);
  assert.equal(parsed[0].totals.perType['301'].five, 1);
});

test('UIGF export only contains five-star rows and required fields', () => {
  const account = {
    uid: '1', timezone: 8, lang: 'zh-cn',
    records: [
      { id: '11', time: '2025-01-01 00:00:00', name: '刻晴', rank: 5, gachaType: '301', uigfType: '301', itemId: '1', itemType: '角色', count: 1 },
      { id: '12', time: '2025-01-02 00:00:00', name: '班尼特', rank: 4, gachaType: '301', uigfType: '301', itemId: '2', itemType: '角色', count: 1 },
    ],
  };
  const out = buildUigf('genshin', account);
  assert.equal(out.info.five_star_only, true);
  assert.equal(out.hk4e[0].list.length, 1);
  assert.equal(out.hk4e[0].list[0].name, '刻晴');
  assert.ok(out.hk4e[0].list[0].id);
  assert.ok(out.hk4e[0].list[0].uigf_gacha_type);
});

test('analysis merges exact totals with history snapshots without double counting', () => {
  const account = {
    uid: '1', records: [
      { id: '1', time: '2025-01-01 00:00:00', name: '刻晴', rank: 5, gachaType: '301', uigfType: '301', pity: 70, itemId: '1', itemType: '角色' },
      { id: '2', time: '2025-02-01 00:00:00', name: '胡桃', rank: 5, gachaType: '301', uigfType: '301', pity: 80, itemId: '2', itemType: '角色' },
    ],
    totals: { exact: 500, perType: { '301': { total: 500, five: 2 } }, currentPity: { '301': 20 }, start: '2024-10-01 00:00:00', end: '2025-03-01 00:00:00' },
    snapshots: [{ id: 's', source: 'manual', periodStart: '2024-01-01', periodEnd: '2025-03-01', totalPulls: 800, fiveStars: 6, fullHistory: false }],
  };
  const result = analyzeGame({ gameId: 'genshin', account, catalog: loadCatalog('genshin') });
  assert.equal(result.counts.exact, 500);
  assert.equal(result.counts.lifetime, 800);
  assert.equal(result.counts.lifetimeFive, 6);
  assert.equal(result.counts.exactFive, 2);
  assert.equal(result.pity.current['301'], 20);
  assert.equal(result.records.length, 2);
  assert.equal(result.mode, 'five-star-only');
});

test('catalog can fuzzy-match an OCR-shaped weapon name', () => {
  const m = matchItem('genshin', '天空之刃');
  assert.ok(m.item);
  assert.equal(m.item.name, '天空之刃');
  assert.equal(m.item.rarity, 5);
});

test('ZZZ official snapshot maps aggregate fields', () => {
  const snap = snapshotFromZzz({
    total_gacha_count: 1234, total_s_count: 18,
    type_stats: [{ gacha_type: '2', total_count: 700, s_count: 10, up_count: 6 }],
  });
  assert.equal(snap.totalPulls, 1234);
  assert.equal(snap.fiveStars, 18);
  assert.equal(snap.fullHistory, true);
  assert.equal(snap.perType['2'].total, 700);
  assert.equal(snap.perType['2'].five, 10);
});

test('avg pity resets on every 5-star, including a lost 50/50', () => {
  const account = {
    records: [
      { id: '1', time: '2026-01-01 00:00:00', name: 'A', rank: 5, gachaType: '11', uigfType: '11', pity: 70, up: 'loss', source: 'official' },
      { id: '2', time: '2026-02-01 00:00:00', name: 'B', rank: 5, gachaType: '11', uigfType: '11', pity: 80, up: 'win', source: 'official' },
    ],
    totals: {
      exact: 150,
      perType: { '11': { total: 150, five: 2 } },
      currentPity: { '11': 15 },
      start: '2026-01-01 00:00:00',
      end: '2026-02-01 00:00:00',
    },
    snapshots: [],
  };
  const d = analyzeGame({ gameId: 'hsr', account, catalog: null });
  assert.equal(d.rates.avgChar, 75);
  assert.equal(d.rates.charSamples, 2);
  assert.equal(d.rates.upDecided, 2);
  assert.equal(d.counts.charPulls, 150);
  assert.equal(d.counts.weaponPulls, 0);
  assert.equal(d.pity.primary, '11');
  assert.equal(d.pity.current['11'], 15);
});

test('character and weapon pools are counted and averaged separately', () => {
  const account = {
    records: [
      { id: 'c1', time: '2026-01-01 00:00:00', name: 'C1', rank: 5, gachaType: '11', uigfType: '11', pity: 70, up: 'win', source: 'official' },
      { id: 'c2', time: '2026-01-02 00:00:00', name: 'C2', rank: 5, gachaType: '11', uigfType: '11', pity: 80, up: 'loss', source: 'official' },
      { id: 'w1', time: '2026-01-03 00:00:00', name: 'W1', rank: 5, gachaType: '12', uigfType: '12', pity: 60, up: 'win', source: 'official' },
    ],
    totals: {
      exact: 230,
      perType: { '11': { total: 150, five: 2 }, '12': { total: 80, five: 1 } },
      currentPity: { '11': 10, '12': 20 },
      start: '2026-01-01 00:00:00',
      end: '2026-01-03 00:00:00',
    },
    snapshots: [],
  };
  const d = analyzeGame({ gameId: 'hsr', account, catalog: null });
  assert.equal(d.counts.charPulls, 150);
  assert.equal(d.counts.weaponPulls, 80);
  assert.equal(d.counts.charFive, 2);
  assert.equal(d.counts.weaponFive, 1);
  assert.equal(d.rates.avgChar, 75);
  assert.equal(d.rates.avgWeapon, 60);
  assert.equal(d.rates.charSamples, 2);
  assert.equal(d.rates.weaponSamples, 1);
  assert.equal(d.rates.upDecided, 2);
  assert.equal(d.rates.upWins, 1);
  assert.equal(d.rates.limitedPerPull, 1 / 150);
  assert.equal(d.pity.primary, '11');
  assert.equal(d.pity.current['11'], 10);
  assert.equal(d.pity.current['12'], 20);
  assert.deepEqual(
    { value: d.pity.kinds.character.value, cap: d.pity.kinds.character.cap },
    { value: 10, cap: 90 },
  );
  assert.deepEqual(
    { value: d.pity.kinds.weapon.value, cap: d.pity.kinds.weapon.cap },
    { value: 20, cap: 80 },
  );
});

test('sourceFromAuthkey produces a valid standard URL', () => {
  const source = sourceFromAuthkey('zzz', KEY, { region: 'prod_gf_cn', gameBiz: 'nap_cn' });
  const url = new URL(buildApiUrl(source, '2', '0'));
  assert.equal(url.hostname, 'public-operation-nap.mihoyo.com');
  assert.equal(url.searchParams.get('authkey'), KEY);
  assert.equal(url.searchParams.get('real_gacha_type'), '2');
});

test('sourceFromAuthkey routes overseas authkeys to hoyoverse hosts', () => {
  const source = sourceFromAuthkey('hsr', KEY, {
    region: 'prod_official_asia',
    gameBiz: 'hkrpg_global',
    isOversea: true,
    lang: 'zh-cn',
  });
  const url = new URL(buildApiUrl(source, '11', '0'));
  assert.equal(url.hostname, 'public-operation-hkrpg-sg.hoyoverse.com');
  assert.equal(url.pathname, '/common/hkrpg_gacha_record/api/getGachaLog');
  assert.equal(url.searchParams.get('game_biz'), 'hkrpg_global');
  assert.equal(url.searchParams.get('gacha_type'), '11');
});

test('cross-source dedupe upgrades a screenshot record to the official record', () => {
  const store = new Store();
  store.touch = () => {};
  store.state.accounts.genshin = null;
  const screenshot = { id: '', uid: '1', time: '2025-01-01 12:00:00', name: '刻晴', rank: 5, gachaType: '301', uigfType: '301', synthetic: true, source: 'screenshot' };
  const first = store.mergeRecords('genshin', [screenshot], { source: 'screenshot' });
  assert.equal(first.added, 1);
  const official = { id: '123456789012345678', uid: '1', time: '2025-01-01 12:00:07', name: '刻晴', rank: 5, gachaType: '301', uigfType: '301', synthetic: false, source: 'official', pity: 77 };
  const second = store.mergeRecords('genshin', [official], { source: 'official' });
  assert.equal(second.added, 0);
  assert.equal(second.upgraded, 1);
  assert.equal(store.state.accounts.genshin.records.length, 1);
  assert.equal(store.state.accounts.genshin.records[0].id, '123456789012345678');
  assert.equal(store.state.accounts.genshin.records[0].synthetic, false);
  assert.equal(store.state.accounts.genshin.records[0].pity, 77);
  const third = store.mergeRecords('genshin', [official], { source: 'official' });
  assert.equal(third.added, 0);
  assert.equal(third.skipped, 1);
  assert.equal(store.state.accounts.genshin.records.length, 1);
});

test('daily totals accumulate across official windows without double counting', () => {
  const store = new Store();
  store.touch = () => {};
  store.state.accounts.hsr = null;
  store.setTotals('hsr', { exact: 100, perType: { '11': { total: 100, five: 3 } }, currentPity: { '11': 20 }, daily: { '2025-01-01|11': 60, '2025-01-02|11': 40 }, start: '2025-01-01 00:00:00', end: '2025-01-02 23:59:59' });
  store.setTotals('hsr', { exact: 80, perType: { '11': { total: 80, five: 2 } }, currentPity: { '11': 30 }, daily: { '2025-02-01|11': 80 }, start: '2025-02-01 00:00:00', end: '2025-02-01 23:59:59' });
  const totals = store.state.accounts.hsr.totals;
  assert.equal(totals.exact, 180);
  assert.equal(totals.perType['11'].total, 180);
  assert.equal(totals.currentPity['11'], 30);
  assert.equal(totals.start, '2025-01-01 00:00:00');
  assert.equal(totals.end, '2025-02-01 23:59:59');
});

test('standard pools are not treated as limited UP pools', () => {
  const account = {
    uid: '1', records: [
      { id: '1', time: '2025-01-01 00:00:00', name: '姬子', rank: 5, gachaType: '1', uigfType: '1', itemId: '1', itemType: '角色' },
    ],
    totals: { exact: 10, perType: { '1': { total: 10, five: 1 } }, currentPity: { '1': 0 }, start: '2025-01-01 00:00:00', end: '2025-01-01 00:00:01' },
    snapshots: [],
  };
  const result = analyzeGame({ gameId: 'hsr', account, catalog: { items: [] } });
  assert.equal(result.records[0].up, null);
  assert.equal(result.pools.find((p) => p.type === '1').hitApplicable, false);
  assert.equal(result.counts.limitedExact, 0);
});

test('character UP hit rate ignores standard and weapon five-stars', () => {
  const account = {
    uid: '1', records: [
      { id: '1', time: '2025-01-01 00:00:00', name: '胡桃', rank: 5, gachaType: '301', uigfType: '301', itemId: '1', itemType: '角色' },
      { id: '2', time: '2025-01-02 00:00:00', name: '夜兰', rank: 5, gachaType: '301', uigfType: '301', itemId: '2', itemType: '角色' },
      { id: '3', time: '2025-01-03 00:00:00', name: '刻晴', rank: 5, gachaType: '301', uigfType: '301', itemId: '3', itemType: '角色' },
      { id: '4', time: '2025-01-04 00:00:00', name: '迪卢克', rank: 5, gachaType: '200', uigfType: '200', itemId: '4', itemType: '角色' },
    ],
    totals: { exact: 100, perType: { '301': { total: 80, five: 3 }, '200': { total: 20, five: 1 } }, currentPity: {}, start: '2025-01-01 00:00:00', end: '2025-01-04 00:00:00' },
    snapshots: [],
  };
  const result = analyzeGame({ gameId: 'genshin', account, catalog: loadCatalog('genshin') });
  assert.equal(result.counts.exactFive, 4);
  assert.equal(result.counts.charFive, 3);
  assert.equal(result.counts.charPulls, 80);
  assert.equal(result.rates.upWins, 2);
  assert.equal(result.rates.upDecided, 3);
  assert.equal(Math.round(result.rates.upRate * 1000) / 1000, 0.667);
});

test('Arknights official history maps six-stars with pity and per-category totals', () => {
  const rows = [
    { gachaTs: '1704067200000', pos: 1, charId: 'a', charName: '甲', rarity: 3, poolName: '标准寻访', poolId: '1' },
    { gachaTs: '1704067201000', pos: 2, charId: 'b', charName: '乙', rarity: 4, poolName: '标准寻访', poolId: '1' },
    { gachaTs: '1704067202000', pos: 3, charId: 'c', charName: '六星甲', rarity: 5, poolName: '标准寻访', poolId: '1' },
    { gachaTs: '1704067203000', pos: 4, charId: 'd', charName: '丙', rarity: 3, poolName: '标准寻访', poolId: '1' },
  ];
  const mapped = tp.mapArknights(rows, { uid: '123', nickname: '刀客塔' });
  assert.equal(mapped.records.length, 1);
  assert.equal(mapped.records[0].name, '六星甲');
  assert.equal(mapped.records[0].rank, 5);
  assert.equal(mapped.records[0].pity, 3);
  assert.equal(mapped.records[0].gachaType, 'standard');
  assert.equal(mapped.totals.exact, 4);
  assert.equal(mapped.totals.perType.standard.total, 4);
  assert.equal(mapped.totals.perType.standard.five, 1);
  assert.equal(mapped.totals.currentPity.standard, 1);
  const analysis = analyzeGame({ gameId: 'arknights', account: { uid: '123', records: mapped.records, totals: mapped.totals, poolNames: mapped.poolNames }, catalog: { items: [] } });
  assert.equal(analysis.rarityLabel, '六星');
  assert.equal(analysis.counts.exact, 4);
  assert.equal(analysis.counts.exactFive, 1);
  assert.equal(analysis.pity.current.standard, 1);
});

test('third-party mapped records persist as top-rarity records with full totals', () => {
  const store = new Store();
  store.touch = () => {};
  store.state.accounts.arknights = null;
  const rows = [
    { gachaTs: '1704067200000', pos: 1, charId: 'c', charName: '六星甲', rarity: 5, poolName: '限定寻访', poolId: '1' },
  ];
  const mapped = tp.mapArknights(rows, { uid: '123', nickname: '刀客塔' });
  const merged = store.mergeRecords('arknights', mapped.records, { source: 'official', meta: { uid: '123' } });
  store.setFullTotals('arknights', mapped.totals);
  store.setPoolNames('arknights', mapped.poolNames);
  assert.equal(merged.added, 1);
  assert.equal(store.state.accounts.arknights.records[0].rank, 5);
  assert.equal(store.state.accounts.arknights.totals.exact, 1);
  assert.equal(store.state.accounts.arknights.poolNames.limited, '限定寻访');
});

test('Endfield official records map character and weapon pools with free pulls excluded from pity', () => {
  const chars = [
    { seqId: '1', charId: 'c1', charName: 'A', rarity: 4, gachaTs: '2026-01-22 10:00:00', __poolType: 'E_CharacterGachaPoolType_Special', isFree: false, poolId: 'p1', poolName: '特许寻访' },
    { seqId: '2', charId: 'c2', charName: 'B', rarity: 6, gachaTs: '2026-01-22 10:00:01', __poolType: 'E_CharacterGachaPoolType_Special', isFree: false, poolId: 'p1', poolName: '特许寻访' },
    { seqId: '3', charId: 'c3', charName: 'C', rarity: 6, gachaTs: '2026-01-22 10:00:02', __poolType: 'E_CharacterGachaPoolType_Special', isFree: true, poolId: 'p1', poolName: '特许寻访' },
  ];
  const weapons = [
    { seqId: 'w1', weaponId: 'w1', weaponName: 'W', rarity: 6, gachaTs: '2026-01-22 10:01:00', __poolId: 'weaponbox_constant_1', poolType: 'constant', poolName: '常驻申领' },
  ];
  const mapped = tp.mapEndfield(chars, weapons, 'hypergryph');
  assert.equal(mapped.records.length, 3);
  assert.equal(mapped.records.find((r) => r.name === 'B').pity, 2);
  assert.equal(mapped.records.find((r) => r.name === 'C').pity, 0);
  assert.equal(mapped.records.find((r) => r.name === 'W').gachaType, 'weapon_constant');
  assert.equal(mapped.totals.exact, 4);
  assert.equal(mapped.totals.perType.char_special.total, 3);
  assert.equal(mapped.totals.perType.weapon_constant.total, 1);
  assert.equal(mapped.totals.currentPity.char_special, 0);
  const analysis = analyzeGame({ gameId: 'endfield', account: { uid: '1', records: mapped.records, totals: mapped.totals, poolNames: mapped.poolNames }, catalog: { items: [] } });
  assert.equal(analysis.rarityLabel, '六星');
  assert.equal(analysis.counts.exact, 4);
  assert.equal(analysis.pools.find((p) => p.type === 'char_special').five, 2);
});

test('NTE gacha summary maps S ranks and current pity per pool', () => {
  const summary = {
    roleid: '123', rolename: '鉴定师',
    gachaDetails: [
      { tab: '限定卡池', drawCount: 100, details: [
        { charid: '1001', rareCount: 70, timeStamp: 1704067200000 },
        { charid: '1002', rareCount: 20, timeStamp: 1704067300000 },
      ] },
      { tab: '常驻卡池', drawCount: 10, details: [] },
      { tab: '弧盘池', drawCount: 40, details: [
        { charid: 'fork_x', rareCount: 40, timeStamp: 1704067400000 },
      ] },
    ],
  };
  const names = new Map([['1001', '角色A'], ['1002', '角色B']]);
  const mapped = tp.mapNte(summary, names, { roleId: '123', roleName: '鉴定师' });
  assert.equal(mapped.records.length, 3);
  assert.equal(mapped.records.find((r) => r.name === '角色A').pity, 70);
  assert.equal(mapped.records.find((r) => r.name === '角色A').up, null);
  assert.equal(mapped.records.find((r) => r.itemId === 'fork_x').name, '弧盘 fork_x');
  assert.equal(mapped.totals.exact, 150);
  assert.equal(mapped.totals.perType.limited.total, 100);
  assert.equal(mapped.totals.currentPityUnknown, true);
  assert.deepEqual(mapped.totals.currentPity, {});
  const analysis = analyzeGame({ gameId: 'nte', account: { uid: '123', records: mapped.records, totals: mapped.totals, poolNames: mapped.poolNames }, catalog: { items: [] } });
  assert.equal(analysis.rarityLabel, 'S级');
  assert.equal(analysis.counts.exact, 150);
  assert.equal(analysis.counts.exactFive, 3);
});

test('NTEUID archive import maps S records and preserves stable ids', () => {
  const payload = {
    format: 'nteuid-gacha', version: 1, uid: '123456789012',
    pools: {
      limited: { records: [{ item_id: '1001', time_ms: 1704067200000, pity: 70 }] },
      permanent: { records: [{ item_id: '1002', time_ms: 1704070800000, pity: 20 }] },
      weapon: { records: [{ item_id: 'fork_x', time_ms: 1704074400000, pity: 40 }] },
    },
  };
  const names = new Map([['1001', '角色A'], ['1002', '角色B']]);
  const parsed = parseNteuidPayload(payload, names);
  assert.equal(parsed.records.length, 3);
  assert.equal(parsed.records.find((r) => r.itemId === '1001').name, '角色A');
  assert.equal(parsed.records.find((r) => r.itemId === 'fork_x').name, '弧盘 fork_x');
  assert.equal(parsed.totals.exact, 130);
  assert.equal(parsed.totals.perType.limited.total, 70);
  assert.equal(parsed.totals.currentPityUnknown, true);
  assert.match(parsed.records[0].id, /^nteuid_123456789012_/);
});

test('NTE exporter counts result rows, not item stack quantity', () => {
  const payload = {
    nte: {
      list: [
        { time: '2026-01-01 00:00:00', pool_id: 'CardPool_NewRole', lottery_id: 'Lottery_Permanent', pool_name: '常驻', item_id: '1001', item_name: '角色·角色A', rarity: 5, count: 1 },
        { time: '2026-01-01 00:00:01', pool_id: 'CardPool_NewRole', lottery_id: 'Lottery_Permanent', pool_name: '常驻', item_id: 'Dice_ticket_01', item_name: '道具·失纬棋子', rarity: 5, count: 16 },
        { time: '2026-01-01 00:00:02', pool_id: 'CardPool_NewRole', lottery_id: 'Lottery_Permanent', pool_name: '常驻', item_id: '1002', item_name: '角色·角色B', rarity: 5, count: 1 },
      ],
    },
  };
  const parsed = parseNteExport(payload);
  assert.equal(parsed.totalPulls, 3);
  assert.equal(parsed.totals.exact, 3);
  assert.equal(parsed.totals.perType.permanent.total, 3);
  assert.equal(parsed.records.find((r) => r.name === '角色A').pity, 1);
  // 5 星道具也按一条结果计算并重置当前池垫抽；关键是 count=16 不能当 16 抽。
  assert.equal(parsed.records.find((r) => r.name === '角色B').pity, 1);
});

test('full NTE re-import replaces old inflated daily totals', () => {
  const store = new Store();
  store.touch = () => {};
  store.state.accounts.nte = {
    records: [],
    totals: { exact: 3553, perType: { permanent: { total: 1098, five: 3 } }, currentPity: { permanent: 2 }, daily: { '2026-06-01|permanent': 1098 }, full: true },
  };
  const totals = store.setTotals('nte', {
    exact: 3,
    perType: { permanent: { total: 3, five: 1 } },
    currentPity: { permanent: 2 },
    daily: { '2026-06-01|permanent': 3 },
    full: true,
    replaceFull: true,
  });
  assert.equal(totals.exact, 3);
  assert.equal(totals.daily['2026-06-01|permanent'], 3);
});

test('third-party timestamps normalize ms, ISO UTC and local strings to +08', () => {
  assert.equal(tp.cnTime(1704067200000), '2024-01-01 08:00:00');
  assert.equal(tp.cnTime('2026-01-01T00:00:00Z'), '2026-01-01 08:00:00');
  assert.equal(tp.cnTime('2026-01-01 12:34:56'), '2026-01-01 12:34:56');
});

test('Endfield gacha URL parser validates host and keeps server id', () => {
  const parsed = tp.parseEndfieldUrl('https://ef-webview.hypergryph.com/page/gacha_123?u8_token=abc&server_id=1&lang=zh-cn');
  assert.equal(parsed.provider, 'hypergryph');
  assert.equal(parsed.serverId, '1');
  assert.equal(parsed.token, 'abc');
  assert.throws(() => tp.parseEndfieldUrl('https://example.com/page/gacha_123?u8_token=abc'));
});

test('matches screenshot rows without timestamps and upgrades them later', () => {
  const store = new Store();
  store.touch = () => {};
  store.state.accounts.genshin = null;
  const shot = { id: '', name: '菲欧妮', rank: 5, gachaType: '301', uigfType: '301', pity: 88, time: '', synthetic: true, source: 'screenshot' };
  assert.equal(store.mergeRecords('genshin', [shot], { source: 'screenshot' }).added, 1);
  assert.equal(store.mergeRecords('genshin', [{ ...shot }], { source: 'screenshot' }).added, 0);
  const official = { id: '999999999999999999', name: '菲欧妮', rank: 5, gachaType: '301', uigfType: '301', pity: 88, time: '2025-01-01 12:00:00', synthetic: false, source: 'official' };
  const result = store.mergeRecords('genshin', [official], { source: 'official' });
  assert.equal(result.upgraded, 1);
  assert.equal(store.state.accounts.genshin.records.length, 1);
  assert.equal(store.state.accounts.genshin.records[0].synthetic, false);
});

test('builds 小黑盒 Arknights JSON from local top records', () => {
  const payload = buildArknightsHeybox({ records: [
    { name: '能天使', rank: 5, time: '2026-11-19 12:00:00', gachaType: 'normal', poolName: '标准寻访', up: 'win', pity: 50 },
    { name: '四星', rank: 4, time: '2026-11-19 12:01:00', gachaType: 'normal' },
  ] });
  const keys = Object.keys(payload);
  assert.equal(keys.length, 1);
  assert.deepEqual(payload[keys[0]].c, [['能天使', 6, false]]);
  assert.equal(payload[keys[0]].p, '标准寻访');
  assert.equal(payload[keys[0]].up, 'win');
  assert.equal(payload[keys[0]].pity, 50);
  assert.throws(() => buildHeybox('endfield', { records: [] }));
});

test('parses 小黑盒 Arknights JSON with full pull sequence for pity', () => {
  const parsed = parseHeyboxArknights({
    1795060800: { c: [['四星', 4, false]], p: '标准寻访' },
    1795060860: { c: [['能天使', 6, false]], p: '标准寻访' },
  });
  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].name, '能天使');
  assert.equal(parsed.records[0].rank, 5);
  assert.equal(parsed.records[0].pity, 2);
  assert.equal(parsed.records[0].gachaType, 'standard');
  assert.equal(parsed.totals.exact, 2);
  assert.equal(parsed.totals.perType.standard.five, 1);
});

test('NTE standard S characters are marked loss in limited pools', () => {
  const account = {
    uid: '1',
    records: [
      { id: '1', time: '2026-11-10 12:00:00', name: '曳尔沐', rank: 5, gachaType: 'limited', uigfType: 'limited', pity: 10 },
      { id: '2', time: '2026-11-11 12:00:00', name: '早雾', rank: 5, gachaType: 'limited', uigfType: 'limited', pity: 20 },
      { id: '3', time: '2026-11-12 12:00:00', name: '早雾', rank: 5, gachaType: 'permanent', uigfType: 'permanent', pity: 30 },
    ],
    totals: { exact: 60, perType: { limited: { total: 30, five: 2 }, permanent: { total: 30, five: 1 } }, currentPity: {} },
  };
  const result = analyzeGame({ gameId: 'nte', account, catalog: { items: [] } });
  assert.equal(result.records.find((r) => r.gachaType === 'limited' && r.name === '早雾').up, 'loss');
  assert.equal(result.rates.upWins, 1);
  assert.equal(result.rates.upLosses, 1);
  assert.equal(result.rates.upRate, 0.5);
});

test('NTE Gacha Exporter import keeps full totals and S pity', () => {
  const parsed = parseNteExport({
    nte: { list: [
      { time: '2026-01-01 00:00:00', rarity: 3, item_name: '道具·迷迭棋子', pool_name: '常驻卡池', pool_id: 'CardPool_NewRole' },
      { time: '2026-01-01 00:01:00', rarity: 5, item_name: '角色·早雾', pool_name: '常驻卡池', pool_id: 'CardPool_NewRole' },
    ] },
  });
  assert.equal(parsed.totalPulls, 2);
  assert.equal(parsed.totals.exactUnknown, false);
  assert.equal(parsed.totals.currentPityUnknown, false);
  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].name, '早雾');
  assert.equal(parsed.records[0].pity, 2);
  assert.equal(parsed.records[0].gachaType, 'permanent');
});

test('NTE arc discs in a character pool are stored as weapons, not characters', () => {
  const parsed = parseNteExport({
    nte: { list: [
      { time: '2026-01-01 00:00:00', rarity: 3, item_name: '角色·薄荷', pool_name: '限定卡池', pool_id: 'CardPool_Character' },
      { time: '2026-01-01 00:00:01', rarity: 5, item_name: '弧盘·危险游戏', item_id: 'fork_dustbin', pool_name: '限定卡池', pool_id: 'CardPool_Character' },
      { time: '2026-01-01 00:00:02', rarity: 5, item_name: '角色·曳尔沐', item_id: '1090', pool_name: '限定卡池', pool_id: 'CardPool_Character' },
    ] },
  });
  assert.equal(parsed.totalPulls, 3);
  assert.equal(parsed.records.length, 2);
  assert.equal(parsed.records.find((r) => r.name === '危险游戏').gachaType, 'weapon');
  assert.equal(parsed.records.find((r) => r.name === '曳尔沐').gachaType, 'limited');
  assert.equal(parsed.totals.currentPity.limited, 0);
});

test('bundled third-party catalogs include images and weapon types', () => {
  const ak = loadCatalog('arknights');
  const ef = loadCatalog('endfield');
  const nte = loadCatalog('nte');
  assert.ok(ak.items.length > 300);
  assert.ok(ak.items.every((i) => i.iconUrl));
  assert.ok(ef.items.some((i) => i.type === '武器'));
  assert.ok(ef.items.every((i) => i.iconUrl));
  assert.ok(nte.items.some((i) => i.type === '弧盘'));
  assert.ok(nte.items.some((i) => i.type === '角色'));
  assert.ok(nte.items.every((i) => i.iconUrl));
});

test('extracts top records from captured Heybox payloads across games', () => {
  const time = '2026-11-10 12:00:00';
  const cases = [
    ['endfield', { data: { list: [{ name: '明河', rarity: 6, time, poolName: '烟火邀星河', pity: 10 }] } }],
    ['genshin', { list: [{ name: '胡桃', rank_type: 5, time, gacha_type: '301', pity: 20 }] }],
    ['nte', { list: [{ name: '曳尔沐', rarity: 'S', time, poolName: '电子人之梦', pity: 5 }] }],
  ];
  for (const [game, payload] of cases) {
    const result = extractHeyboxLive(game, [{ url: 'https://api.xiaoheihe.cn/test', body: JSON.stringify(payload) }]);
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].rank, 5);
  }
});

test('infers UP/loss from current banner data', () => {
  assert.equal(inferBannerUp('endfield', { name: '明河', rank: 5, time: '2026-11-10 12:00:00', gachaType: 'char_special' }), 'win');
  assert.equal(inferBannerUp('endfield', { name: '祀', rank: 5, time: '2026-11-10 12:00:00', gachaType: 'char_special' }), 'loss');
  assert.equal(inferBannerUp('nte', { name: '曳尔沐', rank: 5, time: '2026-11-10 12:00:00', gachaType: 'limited' }), 'win');
  assert.equal(inferBannerUp('arknights', { name: '塔露拉', rank: 5, time: '2026-11-10 12:00:00', gachaType: 'limited' }), 'win');
});
