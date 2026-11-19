const UA = 'Mozilla/5.0 GachaArchive/2.00';
const AK_CHARACTERS = 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/character_table.json';
const AK_AVATAR = 'https://cdn.jsdelivr.net/gh/Aceship/Arknight-Images@main/avatars';
const EF_DATA = 'https://cdn.jsdelivr.net/gh/MR-LORD-REX/endfield-py@main/src/endfield/assets';
const EF_ZH = 'https://cdn.jsdelivr.net/gh/AliceJump/ok-end-field@master/assets/data/characters.json';
const NTE_SITE = 'https://nte.nanoka.cc/';
const NTE_CDN = 'https://static.nanoka.cc';
const NTE_FALLBACK_VERSION = '1.5.4';
const NTE_ELEMENT = {
  Incantation: '咒', Nature: '灵', Lakshana: '相', Chaos: '混沌', Psyche: '心灵', Cosmos: '宇宙',
};
const NTE_WEAPON_TYPE = {
  1: '固态', 2: '液态', 3: '等离子', 4: '气态', 5: '聚合',
};

const AK_PROFESSION = {
  PIONEER: '先锋', SNIPER: '狙击', MEDIC: '医疗', SUPPORT: '辅助',
  CASTER: '术师', SPECIAL: '特种', WARRIOR: '近卫', TANK: '重装',
};
const EF_PROFESSION = {
  VANGUARD: '先锋', GUARD: '近卫', DEFENDER: '重装', SNIPER: '狙击',
  CASTER: '术师', SUPPORTER: '辅助', STRIKER: '突击', ASSAULT: '突击',
};
const EF_ELEMENT = {
  Physical: '物理', Heat: '火', Cryo: '冰', Electric: '电', Nature: '自然', Pulse: '脉冲',
};
const EF_WEAPON = {
  Sword: '单手剑', Claymores: '双手剑', Polearm: '长柄武器', Wand: '施术单元',
  Pistol: '手铳', Handcannon: '手炮', Greatsword: '大剑', ArtsUnit: '施术单元',
};

async function getJson(url, timeout = 30000) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function getText(url, timeout = 30000) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g, '');
}

function mapped(map, key, fallback = '') {
  return map[key] || fallback || key || '';
}

function catalog(game, source, items) {
  return {
    game,
    version: new Date().toISOString().slice(0, 10),
    source,
    updatedAt: new Date().toISOString(),
    items: items.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, 'zh-CN') : String(a.type).localeCompare(String(b.type), 'zh-CN'))),
  };
}

export async function buildArknightsCatalog() {
  const table = await getJson(AK_CHARACTERS, 90000);
  const items = [];
  for (const [charId, row] of Object.entries(table || {})) {
    if (!charId.startsWith('char_') || !row?.name) continue;
    if (['TOKEN', 'TRAP'].includes(row.profession)) continue;
    if (row.isNotObtainable) continue;
    const tier = String(row.rarity || '');
    const rarity = tier === 'TIER_6' ? 5 : tier === 'TIER_5' ? 4 : tier === 'TIER_4' ? 3 : 0;
    if (!rarity) continue;
    items.push({
      id: charId,
      name: row.name,
      aliases: [row.appellation].filter((v) => v && v !== row.name),
      type: '角色',
      rarity,
      iconUrl: `${AK_AVATAR}/${charId}.png`,
      path: mapped(AK_PROFESSION, row.profession, row.profession),
      element: '',
      weaponType: '',
    });
  }
  return catalog('arknights', 'Kengxxiao/ArknightsGameData · Aceship/Arknight-Images', items);
}

export async function buildEndfieldCatalog() {
  const [characters, weapons, nameMap, zh] = await Promise.all([
    getJson(`${EF_DATA}/character/character.json`, 60000),
    getJson(`${EF_DATA}/weapon/weapon.json`, 60000),
    getJson(`${EF_DATA}/common/nameMap.json`, 60000),
    getJson(EF_ZH, 60000).catch(() => ({})),
  ]);
  const zhByName = new Map();
  for (const [key, value] of Object.entries(zh || {})) {
    if (!value?.zh) continue;
    zhByName.set(norm(value.en || key), value.zh);
  }
  // 数据仓库更新滞后时，补充当前卡池里的新角色。
  zhByName.set('minghe', '明河');
  const items = [];
  const seen = new Set();
  for (const row of Object.values(characters || {})) {
    const strId = String(row.StrId || '');
    if (!strId) continue;
    const en = String(nameMap?.[String(row.NameHash)] || strId.replace(/^chr_\d+_/, ''));
    const name = zhByName.get(norm(en)) || en;
    const key = `角色:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: strId,
      name,
      aliases: en && en !== name ? [en] : [],
      type: '角色',
      rarity: row.Rarity === 6 ? 5 : row.Rarity === 5 ? 4 : row.Rarity === 4 ? 3 : 0,
      iconUrl: `https://enka.network/ui/ef/charroundicon/icon_round_${strId}.png`,
      path: mapped(EF_PROFESSION, row.Profession, row.Profession),
      element: mapped(EF_ELEMENT, row.Element, row.Element),
      weaponType: mapped(EF_WEAPON, row.WeaponType, row.WeaponType),
    });
  }
  for (const row of Object.values(weapons || {})) {
    const hash = String(row.NameHash || '');
    const en = String(nameMap?.[hash] || '');
    if (!en) continue;
    const icon = String(row.Icon || '').split('/').pop();
    items.push({
      id: `weapon_${hash}`,
      name: en,
      aliases: [],
      type: '武器',
      rarity: row.Rarity === 6 ? 5 : row.Rarity === 5 ? 4 : row.Rarity === 4 ? 3 : 0,
      iconUrl: icon ? `https://enka.network/ui/ef/itemicon/${icon}` : '',
      path: mapped(EF_WEAPON, row.WeaponType, row.WeaponType),
      element: '',
      weaponType: mapped(EF_WEAPON, row.WeaponType, row.WeaponType),
    });
  }
  return catalog('endfield', 'endfield-py game data · Enka Network assets', items.filter((i) => i.rarity));
}

function decode(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function nteVersion() {
  try {
    const html = await getText(NTE_SITE, 60000);
    const match = html.match(/static\.nanoka\.cc\/nte\/([^/"']+)\/character\.json/);
    if (match) return match[1];
  } catch { /* use known fallback */ }
  return NTE_FALLBACK_VERSION;
}

function nteIcon(path) {
  if (!path) return '';
  return `${NTE_CDN}/assets/nte${path.startsWith('/') ? '' : '/'}${path}.webp`;
}

export async function buildNteCatalog() {
  const version = await nteVersion();
  const [characters, weapons] = await Promise.all([
    getJson(`${NTE_CDN}/nte/${version}/character.json`, 60000),
    getJson(`${NTE_CDN}/nte/${version}/weapon.json`, 60000),
  ]);
  const items = [];
  const seen = new Set();
  for (const row of Object.values(characters || {})) {
    const name = String(row.zh || row.en || '').trim();
    if (!name || !row.icon) continue;
    const key = `角色:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: `nte_char_${row.id}`,
      name,
      aliases: [row.en, row.ja].filter((v) => v && v !== name),
      type: '角色',
      rarity: Number(row.rarity) || 4,
      iconUrl: nteIcon(row.icon),
      path: NTE_ELEMENT[row.element] || row.element || '',
      element: NTE_ELEMENT[row.element] || row.element || '',
      weaponType: '',
    });
  }
  for (const row of Object.values(weapons || {})) {
    const name = String(row.zh || row.en || '').trim();
    if (!name || !row.icon) continue;
    items.push({
      id: `nte_${row.id}`,
      name,
      aliases: [row.en, row.ja].filter((v) => v && v !== name),
      type: '弧盘',
      rarity: Number(row.rarity) || 4,
      iconUrl: nteIcon(row.icon),
      path: NTE_WEAPON_TYPE[row.type_id] || '',
      element: '',
      weaponType: NTE_WEAPON_TYPE[row.type_id] || '',
    });
  }
  return catalog('nte', `nanoka.cc NTE 数据站 · ${version}`, items);
}
