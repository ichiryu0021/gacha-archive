import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve(process.argv[2] || 'demo-data');
fs.mkdirSync(out, { recursive: true });

const samples = {
  genshin: {
    uid: '100000001', nickname: '演示旅行者', gameBiz: 'hk4e_cn',
    records: [
      ['2026-10-08', '奈芙尔', '301', 74, 'win'], ['2026-09-24', '迪希雅', '301', 81, 'loss'],
      ['2026-09-03', '菈乌玛', '301', 12, 'win'], ['2026-07-15', '丝柯克', '302', 66, 'win'],
      ['2026-05-20', '绮良良', '200', 43, 'loss'], ['2026-04-08', '瓦雷莎', '301', 77, 'win'],
      ['2026-01-14', '梦见月瑞希', '301', 69, 'win'], ['2025-12-03', '希诺宁', '301', 19, 'win'],
      ['2025-09-10', '玛拉妮', '302', 64, 'win'], ['2025-06-18', '克洛琳德', '301', 78, 'win'],
      ['2025-03-26', '芙宁娜', '301', 21, 'win'], ['2025-01-01', '提纳里', '200', 56, 'loss'],
      ['2024-10-09', '希格雯', '302', 57, 'win'], ['2024-08-28', '基尼奇', '301', 80, 'win'],
      ['2024-05-01', '刻晴', '301', 72, 'loss'],
    ],
    totals: { exact: 1380, perType: { '301': { total: 940, five: 10 }, '302': { total: 260, five: 3 }, '200': { total: 180, five: 2 } }, currentPity: { '301': 33, '302': 17, '200': 41 } },
  },
  hsr: {
    uid: '100000002', nickname: '演示开拓者', gameBiz: 'hkrpg_cn',
    records: [
      ['2026-11-16', '银狼', '11', 76, 'loss'], ['2026-11-14', '星神★阿哈', '11', 9, 'win'],
      ['2026-10-22', '丹恒·腾荒', '11', 78, 'win'], ['2026-09-24', '长夜月', '11', 75, 'win'],
      ['2026-08-26', '刻律德菈', '12', 66, 'win'], ['2026-07-15', '白厄', '11', 80, 'win'],
      ['2026-06-01', '昔涟', '11', 77, 'win'], ['2026-05-01', '制胜的瞬间', '12', 24, 'loss'],
      ['2026-04-22', '云璃', '11', 71, 'loss'], ['2026-03-25', '飞霄', '11', 68, 'win'],
      ['2026-02-13', '刃', '11', 75, 'loss'], ['2026-01-15', '花火', '12', 70, 'win'],
      ['2025-12-17', '忘归人', '11', 69, 'win'], ['2025-11-05', '星期日', '11', 77, 'win'],
      ['2025-09-24', '灵砂', '12', 65, 'win'],
    ],
    totals: { exact: 2140, perType: { '11': { total: 1510, five: 10 }, '12': { total: 470, five: 3 }, '1': { total: 160, five: 2 } }, currentPity: { '11': 9, '12': 31, '1': 22 } },
  },
  zzz: {
    uid: '100000003', nickname: '演示绳匠', gameBiz: 'nap_cn',
    records: [
      ['2026-11-11', '蕾米埃尔·丹', '2', 70, 'win'], ['2026-10-21', '希格莉德', '2', 78, 'loss'],
      ['2026-09-09', '叶瞬光', '2', 66, 'win'], ['2026-07-29', '仪玄', '2', 81, 'win'],
      ['2026-06-17', '星见雅', '2', 19, 'win'], ['2026-05-06', '莱特', '3', 64, 'win'],
      ['2026-03-24', '扳机', '3', 52, 'win'], ['2026-02-06', '伊芙琳', '2', 77, 'win'],
      ['2025-12-30', '耀嘉音', '2', 73, 'win'], ['2025-11-19', '「钢铁肉垫」', '3', 58, 'loss'],
    ],
    totals: { exact: 1260, perType: { '2': { total: 780, five: 8 }, '3': { total: 320, five: 3 }, '1': { total: 160, five: 1 } }, currentPity: { '2': 12, '3': 28, '1': 45 } },
  },
  hi3: {
    uid: '100000004', nickname: '演示舰长', gameBiz: 'bh3_cn',
    records: [
      ['2026-07-23', '希娜狄雅', '1', 42, 'win'], ['2026-05-28', '愈生佑翎', '1', 67, 'win'],
      ['2026-02-05', '镇×偃月叩晓', '1', 81, 'win'], ['2025-12-04', '窈窕谍影', '1', 29, 'win'],
      ['2025-09-25', '爱愿偕光', '2', 55, 'loss'],
    ],
    totals: { exact: 620, perType: { '1': { total: 480, five: 4 }, '2': { total: 140, five: 1 } }, currentPity: { '1': 24, '2': 18 } },
  },
  tot: {
    uid: '100000005', nickname: '演示律师', gameBiz: 'tot_cn',
    records: [
      ['2026-09-16', '左然·烬火', '2', 63, 'win'], ['2026-04-15', '陆景和·潮汐', '2', 77, 'win'],
      ['2025-12-09', '莫弈·雪夜', '1', 58, 'loss'], ['2025-10-29', '夏彦·晨星', '3', 22, 'win'],
    ],
    totals: { exact: 340, perType: { '2': { total: 180, five: 2 }, '1': { total: 100, five: 1 }, '3': { total: 60, five: 1 } }, currentPity: { '1': 34, '2': 16, '3': 8 } },
  },
};

const gameMeta = {
  genshin: { pools: { '301': '角色活动祈愿', '302': '武器活动祈愿', '200': '常驻祈愿' }, itemType: '角色' },
  hsr: { pools: { '11': '角色活动跃迁', '12': '光锥活动跃迁', '1': '常驻跃迁' }, itemType: '角色' },
  zzz: { pools: { '2': '独家频段', '3': '音擎频段', '1': '常驻频段' }, itemType: '代理人' },
  hi3: { pools: { '1': '扩充补给', '2': '家园补给' }, itemType: '女武神' },
  tot: { pools: { '1': '常驻启示', '2': '限定启示', '3': '生日启示' }, itemType: '思绪' },
};

const accounts = {};
for (const [game, sample] of Object.entries(samples)) {
  const meta = gameMeta[game];
  const records = sample.records.map(([time, name, gachaType, pity, up], i) => ({
    id: `demo_${game}_${i}`,
    uid: sample.uid,
    gachaType,
    uigfType: gachaType,
    itemId: '',
    count: 1,
    time: `${time} 12:00:00`,
    name,
    itemType: meta.itemType,
    rank: 5,
    lang: 'zh-cn',
    poolName: meta.pools[gachaType] || '演示卡池',
    pity,
    up,
    source: 'demo',
    synthetic: false,
    version: null,
  }));
  const fiveByType = {};
  for (const r of records) fiveByType[r.gachaType] = (fiveByType[r.gachaType] || 0) + 1;
  const perType = {};
  for (const [type, stats] of Object.entries(sample.totals.perType)) perType[type] = { ...stats, five: fiveByType[type] || stats.five };
  accounts[game] = {
    uid: sample.uid,
    nickname: sample.nickname,
    region: 'cn_gf01',
    gameBiz: sample.gameBiz,
    lang: 'zh-cn',
    timezone: 8,
    records,
    totals: {
      exact: sample.totals.exact,
      perType,
      currentPity: sample.totals.currentPity,
      daily: {},
      start: records.at(-1)?.time || null,
      end: records[0]?.time || null,
      fetchedAt: new Date().toISOString(),
      full: true,
    },
    snapshots: [],
    createdAt: new Date().toISOString(),
    lastSync: new Date().toISOString(),
    lastSource: 'demo',
  };
}

const app = {
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accounts,
  settings: {
    includeSyntheticInExport: true,
    showEstimated: true,
    collectorEnabled: false,
    collectorInterval: 30000,
    gameOrder: ['genshin', 'hsr', 'zzz', 'hi3', 'tot'],
    hiddenGames: [],
  },
  collector: { lastRun: null, lastEvent: null, events: [] },
};
fs.writeFileSync(path.join(out, 'app.json'), JSON.stringify(app, null, 2), 'utf8');
for (const name of fs.readdirSync('data')) {
  if (/^(catalog-|versions-|up-pools)/.test(name) && fs.statSync(path.join('data', name)).isFile()) {
    fs.copyFileSync(path.join('data', name), path.join(out, name));
  }
}
console.log(`demo data written to ${out}`);
