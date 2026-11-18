import fs from 'node:fs';

const base = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const hsrChars = JSON.parse(fs.readFileSync('research/hsr-characters.json','utf8'));
const hsrCones = JSON.parse(fs.readFileSync('research/hsr-light_cones.json','utf8'));
const hsr = {
  game: 'hsr', version: 'live', source: 'Mar-7th/StarRailRes',
  updatedAt: new Date().toISOString(),
  items: [
    ...Object.entries(hsrChars).map(([id,v]) => ({id:String(id), name:v.name, type:'角色', rarity:v.rarity, iconUrl:base+v.icon, path:v.path, element:v.element})),
    ...Object.entries(hsrCones).map(([id,v]) => ({id:String(id), name:v.name, type:'光锥', rarity:v.rarity, iconUrl:base+v.icon, path:v.path})),
  ].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')),
};
fs.writeFileSync('data/catalog-hsr.json', JSON.stringify(hsr,null,2));

const gi = JSON.parse(fs.readFileSync('research/genshin-catalog.json','utf8'));
const genshin = {
  game: 'genshin', version: '7.2', source: 'genshin-db 5.2.15 / miHoYo CDN',
  updatedAt: new Date().toISOString(),
  items: [
    ...gi.characters.map(v=>({id:String(v.id), name:v.name, type:'角色', rarity:v.rarity, weaponType:v.type, iconUrl:v.img, icon:v.icon})),
    ...gi.weapons.map(v=>({id:String(v.id), name:v.name, type:'武器', rarity:v.rarity, weaponType:v.type, iconUrl:v.img, icon:v.icon})),
  ].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')),
};
fs.writeFileSync('data/catalog-genshin.json', JSON.stringify(genshin,null,2));

const zc = JSON.parse(fs.readFileSync('research/zzz-character.json','utf8'));
const zw = JSON.parse(fs.readFileSync('research/zzz-weapon.json','utf8'));
const zb = JSON.parse(fs.readFileSync('research/zzz-bangboo.json','utf8'));
const rankMap = r => (r>=4?5:r===3?4:3);
const zitems = [];
for (const [id,v] of Object.entries(zc)) {
  if (!v.CHS) continue;
  zitems.push({id:String(id), name:v.CHS, type:'代理人', rarity:rankMap(v.rank||4), iconUrl:`https://enka.network/ui/zzz/${v.icon}.png`, icon:v.icon, element:v.element});
}
for (const [id,v] of Object.entries(zw)) {
  if (!v.CHS) continue;
  zitems.push({id:String(id), name:v.CHS, type:'音擎', rarity:rankMap(v.rank||3), iconUrl:`https://enka.network/ui/zzz/${v.icon}.png`, icon:v.icon});
}
for (const [id,v] of Object.entries(zb)) {
  if (!v.CHS) continue;
  zitems.push({id:String(id), name:v.CHS, type:'邦布', rarity:rankMap(v.rank||3), iconUrl:'', icon:v.icon});
}
const zzz = {game:'zzz',version:'live',source:'Genshin-Optimizer/zzz-hakushin-data + Enka UI',updatedAt:new Date().toISOString(),items:zitems.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'))};
fs.writeFileSync('data/catalog-zzz.json', JSON.stringify(zzz,null,2));
console.log('genshin',genshin.items.length,'hsr',hsr.items.length,'zzz',zzz.items.length);
