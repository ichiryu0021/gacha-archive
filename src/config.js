import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const PUBLIC_DIR = path.join(ROOT, 'public');
export const DATA_DIR = process.env.GACHA_DATA_DIR ? path.resolve(process.env.GACHA_DATA_DIR) : path.join(ROOT, 'data');
export const BUNDLED_DATA_DIR = path.join(ROOT, 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
export const ASSET_DIR = path.join(DATA_DIR, 'assets');
export const DB_FILE = path.join(DATA_DIR, 'app.json');
export const PORT = Number(process.env.PORT || 8787);
export const HOST = '127.0.0.1';
export const APP_VERSION = '1.0.9';

export const GAMES = {
  genshin: {
    id: 'genshin',
    name: '原神',
    en: 'Genshin Impact',
    short: 'Genshin',
    accent: '#63d8c4',
    accent2: '#e9c77b',
    api: {
      cn: 'https://public-operation-hk4e.mihoyo.com',
      os: 'https://public-operation-hk4e-sg.hoyoverse.com',
      path: '/gacha_info/api/getGachaLog',
    },
    gameBiz: { cn: 'hk4e_cn', os: 'hk4e_global' },
    typeParam: 'gacha_type',
    types: ['100', '200', '301', '302', '500'],
    pools: {
      '100': '新手祈愿',
      '200': '常驻祈愿',
      '301': '角色活动祈愿',
      '302': '武器活动祈愿',
      '400': '角色活动祈愿·2',
      '500': '集录祈愿',
    },
    uigfMap: { '100': '100', '200': '200', '301': '301', '400': '301', '302': '302', '500': '500' },
    pityCap: { '100': 90, '200': 90, '301': 90, '302': 80, '500': 90 },
    standard5: [
      '迪卢克', '琴', '莫娜', '七七', '刻晴', '提纳里', '迪希雅',
      '天空之刃', '天空之傲', '天空之卷', '天空之翼', '天空之脊', '狼的末路',
      '四风原典', '阿莫斯之弓', '和璞鸢', '风鹰剑',
    ],
    expectedFive: { '301': 62.5, '302': 53.5, '200': 62.5, '100': 34.6, '500': 62.5 },
    launchDate: '2020-09-28',
    officialWindow: '约 1 年',
  },
  hsr: {
    id: 'hsr',
    name: '崩坏：星穹铁道',
    en: 'Honkai: Star Rail',
    short: 'Star Rail',
    accent: '#9b8cff',
    accent2: '#6ddcff',
    api: {
      cn: 'https://public-operation-hkrpg.mihoyo.com',
      os: 'https://public-operation-hkrpg-sg.hoyoverse.com',
      path: '/common/hkrpg_gacha_record/api/getGachaLog',
      ldPath: '/common/hkrpg_gacha_record/api/getLdGachaLog',
    },
    gameBiz: { cn: 'hkrpg_cn', os: 'hkrpg_global' },
    typeParam: 'gacha_type',
    types: ['11', '12', '1', '2', '21', '22'],
    pools: {
      '1': '常驻跃迁',
      '2': '始发跃迁',
      '11': '角色活动跃迁',
      '12': '光锥活动跃迁',
      '21': '角色联动跃迁',
      '22': '光锥联动跃迁',
    },
    uigfMap: { '1': '1', '2': '2', '11': '11', '12': '12', '21': '21', '22': '22' },
    pityCap: { '1': 90, '2': 50, '11': 90, '12': 80, '21': 90, '22': 80 },
    standard5: [
      '姬子', '瓦尔特', '布洛妮娅', '杰帕德', '克拉拉', '彦卿', '白露',
      '银河铁道之夜', '无可取代的东西', '但战斗还未结束', '制胜的瞬间',
      '时节不居', '以世界之名', '如泥酣眠',
    ],
    expectedFive: { '11': 62.5, '12': 53.5, '1': 62.5, '2': 34.6, '21': 62.5, '22': 53.5 },
    launchDate: '2023-04-26',
    officialWindow: '约 6 个月 / 联动池 24 个月',
  },
  hi3: {
    id: 'hi3',
    name: '崩坏3',
    en: 'Honkai Impact 3rd',
    short: 'HI3',
    accent: '#8fc7ff',
    accent2: '#b48cff',
    api: { cn: '', os: '', path: '' },
    gameBiz: { cn: 'bh3_cn', os: 'bh3_global' },
    typeParam: 'gacha_type',
    types: ['1', '2', '3'],
    pools: { '1': '家园补给', '2': '精准补给', '3': '扩充补给' },
    uigfMap: { '1': '1', '2': '2', '3': '3' },
    pityCap: { '1': 100, '2': 100, '3': 100 },
    standard5: [],
    expectedFive: { '1': 100, '2': 100, '3': 100 },
    launchDate: '2016-10-14',
    officialWindow: '本地',
    manualOnly: true,
  },
  tot: {
    id: 'tot',
    name: '未定事件簿',
    en: 'Tears of Themis',
    short: 'TOT',
    accent: '#e8a6c8',
    accent2: '#9fb7ff',
    api: { cn: '', os: '', path: '' },
    gameBiz: { cn: 'tot_cn', os: 'tot_global' },
    typeParam: 'gacha_type',
    types: ['1', '2', '3'],
    pools: { '1': '常驻启示', '2': '限定启示', '3': '生日启示' },
    uigfMap: { '1': '1', '2': '2', '3': '3' },
    pityCap: { '1': 100, '2': 100, '3': 100 },
    standard5: [],
    expectedFive: { '1': 100, '2': 100, '3': 100 },
    launchDate: '2020-07-29',
    officialWindow: '本地',
    manualOnly: true,
  },
  zzz: {
    id: 'zzz',
    name: '绝区零',
    en: 'Zenless Zone Zero',
    short: 'ZZZ',
    accent: '#f4d34d',
    accent2: '#ff8b66',
    api: {
      cn: 'https://public-operation-nap.mihoyo.com',
      os: 'https://public-operation-nap-sg.hoyoverse.com',
      path: '/common/gacha_record/api/getGachaLog',
    },
    gameBiz: { cn: 'nap_cn', os: 'nap_global' },
    typeParam: 'real_gacha_type',
    types: ['2', '3', '1', '5', '102', '103'],
    pools: {
      '1': '常驻频段',
      '2': '独家频段',
      '3': '音擎频段',
      '5': '邦布频段',
      '102': '独家重映',
      '103': '音擎回响',
    },
    uigfMap: { '1': '1', '2': '2', '3': '3', '5': '5', '102': '2', '103': '3' },
    pityCap: { '1': 90, '2': 90, '3': 80, '5': 80, '102': 90, '103': 80 },
    standard5: [
      '猫又', '丽娜', '格莉丝', '莱卡恩', '11号', '珂蕾妲',
      '「钢铁肉垫」', '「燃狱齿轮」', '「啜泣摇篮」', '「硫磺石」', '「嵌合编译器」', '「拘缚者」',
    ],
    expectedFive: { '2': 62.5, '3': 53.5, '1': 62.5, '5': 50, '102': 62.5, '103': 53.5 },
    launchDate: '2024-07-04',
    officialWindow: '以接口实际返回为准；官方统计工具含全量汇总',
  },
};

export const GAME_IDS = Object.keys(GAMES);

export function getGame(id) {
  const game = GAMES[id];
  if (!game) throw new Error('未知的游戏');
  return game;
}

export function isKnownHost(hostname) {
  return /(^|\.)(mihoyo\.com|hoyoverse\.com|miyoushe\.com|hoyolab\.com)$/i.test(hostname);
}

export function isAllowedAssetHost(hostname) {
  return /(^|\.)(mihoyo\.com|hoyoverse\.com|hoyolab\.com|miyoushe\.com|githubusercontent\.com|jsdelivr\.net|enka\.network)$/i.test(hostname);
}
