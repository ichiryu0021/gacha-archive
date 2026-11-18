import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGachaLink, buildApiUrl, sourceFromAuthkey, summarizePullTotals } from '../src/api/gacha.js';
import { parseUigfPayload, buildUigf, snapshotFromZzz } from '../src/api/uigf.js';
import { analyzeGame } from '../src/api/analyze.js';
import { loadCatalog, matchItem } from '../src/api/catalog.js';
import { Store } from '../src/store.js';

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

test('sourceFromAuthkey produces a valid standard URL', () => {
  const source = sourceFromAuthkey('zzz', KEY, { region: 'prod_gf_cn', gameBiz: 'nap_cn' });
  const url = new URL(buildApiUrl(source, '2', '0'));
  assert.equal(url.hostname, 'public-operation-nap.mihoyo.com');
  assert.equal(url.searchParams.get('authkey'), KEY);
  assert.equal(url.searchParams.get('real_gacha_type'), '2');
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

test('overall hit rate uses limited five-stars over all five-stars', () => {
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
  assert.equal(result.rates.upWins, 2);
  assert.equal(Math.round(result.rates.upRate * 1000) / 1000, 0.5);
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
