import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DATA_DIR, GAMES } from '../config.js';
import { dpapi } from './auth.js';
import { uid } from '../utils.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HYPERGRYPH_SESSION_FILE = path.join(DATA_DIR, 'hypergryph-session.dat');
const TAJIDUO_SESSION_FILE = path.join(DATA_DIR, 'tajiduo-session.dat');

const AS = 'https://as.hypergryph.com';
const BINDING = 'https://binding-api-account-prod.hypergryph.com';
const AK = 'https://ak.hypergryph.com';
const SKLAND_APP_CODE = '4ca99fa6b56cc2ba';
const WEB_APP_CODE = 'be36d44aa36bfb5b';
const EF_CN = 'https://ef-webview.hypergryph.com';
const EF_GLOBAL = 'https://ef-webview.gryphline.com';

const TAJIDUO_BASE = 'https://bbs-api.tajiduo.com';
const LAOHU_BASE = 'https://user.laohu.com';
const TAJIDUO_APP_ID = '10550';
const TAJIDUO_USER_CENTER_APP_ID = '10551';
const TAJIDUO_SECRET = '89155cc4e8634ec5b1b6364013b23e3e';
const TAJIDUO_DS_SECRET = 'pUds3dfMkl';
const TAJIDUO_APP_VERSION = '1.2.5';
const TAJIDUO_OKHTTP_UA = 'okhttp/4.12.0';
const NTE_GAME_ID = '1289';

let hypergryphSession = null;
let tajiduoSession = null;
let lastTajiduoError = null;
const hypergryphQr = new Map();
const endfieldContentCache = new Map();

function formBody(data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return params;
}

async function request(url, { method = 'GET', headers = {}, body, form = false, timeout = 25000 } = {}) {
  const finalHeaders = {
    'User-Agent': UA,
    Accept: 'application/json, text/plain, */*',
    ...headers,
  };
  let payload;
  if (body !== undefined) {
    if (form) {
      finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/x-www-form-urlencoded';
      payload = formBody(body).toString();
    } else {
      finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
      payload = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: payload,
    signal: AbortSignal.timeout(timeout),
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  return { res, status: res.status, json, text };
}

function pickToken(body) {
  return body?.data?.token || body?.data?.content || body?.token || body?.content || '';
}

function pickList(body) {
  const data = body?.data ?? body;
  if (Array.isArray(data)) return data;
  return data?.list || body?.list || [];
}

function isZeroCode(value) {
  return value === 0 || value === '0';
}

function statusOk(body) {
  if (!body || typeof body !== 'object') return false;
  if (body.status !== undefined) return isZeroCode(body.status);
  if (body.code !== undefined) return isZeroCode(body.code);
  return true;
}

async function recordTajiduoError(stage, error) {
  lastTajiduoError = {
    stage,
    message: String(error?.message || error || ''),
    at: new Date().toISOString(),
  };
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    await fsp.appendFile(path.join(DATA_DIR, 'tajiduo-debug.log'), `${lastTajiduoError.at} [${stage}] ${lastTajiduoError.message}\n`, 'utf8');
  } catch { /* debug log is optional */ }
}

async function persist(file, value) {
  if (!value) {
    await fsp.unlink(file).catch(() => {});
    return;
  }
  try {
    const encrypted = await dpapi('protect', JSON.stringify(value));
    await fsp.mkdir(DATA_DIR, { recursive: true });
    await fsp.writeFile(file, encrypted, 'utf8');
  } catch (e) {
    console.error('[thirdparty] save session failed', e.message);
  }
}

async function restore(file) {
  try {
    if (!fs.existsSync(file)) return null;
    const encrypted = await fsp.readFile(file, 'utf8');
    const text = await dpapi('unprotect', encrypted);
    return JSON.parse(text);
  } catch (e) {
    console.error('[thirdparty] restore session failed', e.message);
    return null;
  }
}

export async function restoreThirdPartySessions() {
  hypergryphSession = await restore(HYPERGRYPH_SESSION_FILE);
  tajiduoSession = await restore(TAJIDUO_SESSION_FILE);
  return {
    hypergryph: hypergryphStatus(),
    tajiduo: tajiduoStatus(),
  };
}

// ---------------- 通用时间 / 记录 ----------------

export function cnTime(value) {
  if (value === undefined || value === null || value === '') return '';
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    const ms = numeric < 1e12 ? numeric * 1000 : numeric;
    return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  }
  const source = String(value).trim();
  if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(source)) {
    const parsed = Date.parse(source);
    if (Number.isFinite(parsed)) return new Date(parsed + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  }
  const text = source.replace('T', ' ').replace(/\//g, '-');
  const m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):?(\d{1,2})?:?(\d{1,2})?)?/);
  if (!m) return '';
  const pad = (x) => String(x || 0).padStart(2, '0');
  return `${m[1]}-${pad(m[2])}-${pad(m[3])} ${pad(m[4])}:${pad(m[5])}:${pad(m[6])}`;
}

function timestamp(value) {
  const time = cnTime(value);
  if (!time) return 0;
  return Date.parse(`${time.replace(' ', 'T')}+08:00`) || 0;
}

function compareRows(a, b) {
  const byTime = timestamp(a.time) - timestamp(b.time);
  if (byTime) return byTime;
  const left = String(a.sort ?? '');
  const right = String(b.sort ?? '');
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) return left.length - right.length || left.localeCompare(right);
  return left.localeCompare(right);
}

function topRecordsFromAll(rows, topRank, mapper) {
  const sorted = [...rows].sort(compareRows);
  const records = [];
  const pity = {};
  const groupPity = {};
  for (const row of sorted) {
    const type = String(row.type || row.gachaType || row.uigfType || '');
    const group = String(row.pityGroup || type);
    const isFree = Boolean(row.isFree);
    if (!isFree) groupPity[group] = (groupPity[group] || 0) + 1;
    if (Number(row.rarity) === topRank) {
      // 免费六星不消耗付费保底，也不重置当前垫抽；记录里展示抽到它时已垫的付费抽数。
      records.push(mapper(row, groupPity[group] || 0));
      pity[type] = groupPity[group] || 0;
      if (!isFree) groupPity[group] = 0;
    }
  }
  // 当前垫抽按类型取“最后一个抽卡分组”的值；限定池等按 poolId 分桶时更准确。
  for (const row of [...sorted].reverse()) {
    const type = String(row.type || row.gachaType || row.uigfType || '');
    const group = String(row.pityGroup || type);
    if (groupPity[group] !== undefined) {
      pity[type] = groupPity[group];
      break;
    }
  }
  return { records, pity };
}

// ---------------- 森空岛 / 鹰角 ----------------

function hypergryphStatus() {
  return {
    connected: Boolean(hypergryphSession?.userToken),
    user: hypergryphSession?.user || null,
    bindings: hypergryphSession?.bindings || [],
    updatedAt: hypergryphSession?.updatedAt || null,
  };
}

async function fetchBindings() {
  if (!hypergryphSession?.userToken) throw new Error('森空岛尚未登录');
  // binding_list 需要网页端 grant token，不能直接用扫码得到的通行证 token。
  const bindingToken = await grantWebToken();
  const token = encodeURIComponent(bindingToken);
  const { status, json, text } = await request(`${BINDING}/account/binding/v1/binding_list?token=${token}`, {
    headers: { Origin: 'https://user.hypergryph.com', Referer: 'https://user.hypergryph.com/' },
  });
  if (status >= 400 || !statusOk(json)) {
    const message = json?.msg || json?.message || text || `HTTP ${status}`;
    throw new Error(`读取鹰角绑定角色失败：${message}`);
  }
  const data = json?.data || json || {};
  const list = Array.isArray(data.list) ? data.list : Array.isArray(data) ? data : [];
  const bindings = [];
  for (const app of list) {
    const appCode = String(app.appCode || '');
    for (const binding of app.bindingList || []) {
      const roles = Array.isArray(binding.roles) ? binding.roles : [];
      bindings.push({
        appCode,
        appName: String(app.appName || ''),
        uid: String(binding.uid || ''),
        channelMasterId: String(binding.channelMasterId ?? ''),
        channelName: String(binding.channelName || ''),
        isOfficial: Boolean(binding.isOfficial),
        nickname: String(binding.nickName || binding.nickname || roles[0]?.nickname || ''),
        roles: roles.map((role) => ({
          roleId: String(role.roleId || ''),
          serverId: String(role.serverId || ''),
          serverName: String(role.serverName || ''),
          nickname: String(role.nickName || role.nickname || ''),
          level: Number(role.level) || 0,
        })),
      });
    }
  }
  hypergryphSession.bindings = bindings;
  hypergryphSession.user = {
    nickname: bindings[0]?.nickname || hypergryphSession.user?.nickname || '',
  };
  hypergryphSession.updatedAt = new Date().toISOString();
  await persist(HYPERGRYPH_SESSION_FILE, hypergryphSession);
  return bindings;
}

export async function createHypergryphQr() {
  const { status, json, text } = await request(`${AS}/general/v1/gen_scan/login`, {
    method: 'POST',
    body: { appCode: SKLAND_APP_CODE },
  });
  if (status >= 400 || !statusOk(json) || !json?.data?.scanId) {
    throw new Error(json?.msg || json?.message || text || '无法生成森空岛登录二维码');
  }
  const id = uid('hg_');
  hypergryphQr.set(id, {
    scanId: json.data.scanId,
    scanUrl: json.data.scanUrl || `hypergryph://scan_login?scanId=${json.data.scanId}`,
    createdAt: Date.now(),
    status: 'Created',
  });
  setTimeout(() => hypergryphQr.delete(id), 10 * 60 * 1000).unref?.();
  return { id, url: hypergryphQr.get(id).scanUrl, expiresIn: 120 };
}

export async function pollHypergryphQr(id) {
  const session = hypergryphQr.get(id);
  if (!session) throw new Error('二维码会话已过期，请重新生成');
  if (session.status === 'Confirmed') return { status: 'Confirmed', ...hypergryphStatus() };
  const { status, json } = await request(`${AS}/general/v1/scan_status?scanId=${encodeURIComponent(session.scanId)}`);
  const scanStatus = Number(json?.status);
  if (status >= 400) {
    return { status: 'Error', message: json?.msg || json?.message || `登录状态查询失败（${status}）` };
  }
  if (scanStatus === 100) return { status: 'Created', message: json?.msg || '等待扫码' };
  if (scanStatus === 101) return { status: 'Scanned', message: json?.msg || '已扫描，请在手机上确认' };
  if (scanStatus === 102) return { status: 'Expired', message: json?.msg || '二维码已失效' };
  if (scanStatus !== 0) {
    return { status: 'Error', message: json?.msg || json?.message || `登录状态查询失败（${scanStatus}）` };
  }
  const scanCode = json?.data?.scanCode || '';
  if (!scanCode) return { status: 'Created', message: '等待扫码' };
  const tokenRes = await request(`${AS}/user/auth/v1/token_by_scan_code`, {
    method: 'POST',
    body: { scanCode },
  });
  if (tokenRes.status >= 400 || !statusOk(tokenRes.json)) {
    throw new Error(tokenRes.json?.msg || tokenRes.json?.message || '森空岛登录失败');
  }
  const userToken = pickToken(tokenRes.json);
  if (!userToken) throw new Error('森空岛没有返回登录凭据');
  hypergryphSession = {
    userToken,
    user: {},
    bindings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  session.status = 'Confirmed';
  await persist(HYPERGRYPH_SESSION_FILE, hypergryphSession);
  let bindings = [];
  let bindError = '';
  try { bindings = await fetchBindings(); } catch (e) { bindError = e.message; }
  return { status: 'Confirmed', user: hypergryphSession.user, bindings, ...(bindError ? { message: bindError } : {}) };
}

export async function hypergryphRefreshBindings() {
  if (!hypergryphSession?.userToken) throw new Error('森空岛尚未登录');
  return fetchBindings();
}

export async function hypergryphLogout() {
  hypergryphSession = null;
  hypergryphQr.clear();
  await persist(HYPERGRYPH_SESSION_FILE, null);
  return { connected: false };
}

async function grantWebToken() {
  if (!hypergryphSession?.userToken) throw new Error('森空岛尚未登录');
  const { status, json, text } = await request(`${AS}/user/oauth2/v2/grant`, {
    method: 'POST',
    body: { token: hypergryphSession.userToken, appCode: WEB_APP_CODE, type: 1 },
  });
  if (status >= 400 || !statusOk(json)) {
    throw new Error(json?.msg || json?.message || text || '鹰角网页授权失败，请重新扫码');
  }
  const token = pickToken(json);
  if (!token) throw new Error('鹰角网页授权没有返回 token');
  return token;
}

async function getRoleToken(uid, webToken) {
  const { status, json, text } = await request(`${BINDING}/account/binding/v1/u8_token_by_uid`, {
    method: 'POST',
    body: { uid: String(uid), token: webToken },
  });
  if (status >= 400 || !statusOk(json)) {
    throw new Error(json?.msg || json?.message || text || '获取游戏角色 token 失败');
  }
  const token = pickToken(json);
  if (!token) throw new Error('获取游戏角色 token 失败：响应缺少 token');
  return token;
}

function pickBinding(game) {
  const appCode = game === 'arknights' ? 'arknights' : 'endfield';
  const binding = (hypergryphSession?.bindings || []).find((item) => item.appCode === appCode);
  if (!binding) throw new Error(game === 'arknights' ? '森空岛账号没有绑定明日方舟角色' : '森空岛账号没有绑定终末地角色');
  return binding;
}

async function akLoginCookie(roleToken) {
  const { res, status, json, text } = await request(`${AK}/user/api/role/login`, {
    method: 'POST',
    body: { token: roleToken },
    headers: { Accept: 'application/json', Origin: 'https://ak.hypergryph.com', Referer: 'https://ak.hypergryph.com/user/inquiryGacha' },
  });
  if (status >= 400) throw new Error(json?.message || text || `明日方舟角色登录失败（${status}）`);
  let cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (!cookies.length) {
    const header = res.headers.get('set-cookie') || '';
    cookies = header ? header.split(/,(?=\s*[^;=]+=)/) : [];
  }
  const raw = cookies.map((line) => String(line).split(';')[0]).find((line) => line.startsWith('ak-user-center='));
  if (!raw) throw new Error('明日方舟角色登录失败：没有取得 ak-user-center');
  return raw;
}

function akHeaders(accountToken, roleToken, cookie) {
  return {
    'X-Account-Token': accountToken,
    'X-Role-Token': roleToken,
    Cookie: cookie,
    Accept: 'application/json, text/plain, */*',
    Origin: 'https://ak.hypergryph.com',
    Referer: 'https://ak.hypergryph.com/user/inquiryGacha',
  };
}

function arknightsType(name, id) {
  const text = String(name || '');
  if (/限定/.test(text)) return 'limited';
  if (/中坚/.test(text)) return 'kernel';
  if (/联动|合作/.test(text)) return 'collab';
  if (/标准|常驻|联合|定向|归航|庆典/.test(text)) return 'standard';
  const poolId = String(id || '').toUpperCase();
  if (poolId.startsWith('LIMITED')) return 'limited';
  if (poolId.startsWith('CLASSIC') || poolId.startsWith('NORM')) return 'standard';
  if (poolId.startsWith('LINKAGE')) return 'collab';
  if (poolId.startsWith('ATTAIN')) return 'kernel';
  return /^\d+$/.test(String(id || '')) ? `ak_${id}` : 'other';
}

async function akCategories(uid, roleToken, accountToken, cookie) {
  const { status, json, text } = await request(`${AK}/user/api/inquiry/gacha/cate?uid=${encodeURIComponent(uid)}`, {
    headers: akHeaders(accountToken, roleToken, cookie),
  });
  if (status >= 400 || !statusOk(json)) {
    throw new Error(json?.message || json?.msg || text || '读取明日方舟寻访类别失败');
  }
  if (process.env.DEBUG_AK_CATE) console.error('[ak-cate]', status, JSON.stringify(json).slice(0, 1000));
  return Array.isArray(json?.data) ? json.data : [];
}

async function akHistoryPage({ uid, category, roleToken, accountToken, cookie, gachaTs, pos }) {
  const query = new URLSearchParams({ uid, category: String(category), size: '100' });
  if (gachaTs) query.set('gachaTs', String(gachaTs));
  if (pos !== undefined && pos !== null && pos !== '') query.set('pos', String(pos));
  const { status, json, text } = await request(`${AK}/user/api/inquiry/gacha/history?${query.toString()}`, {
    headers: akHeaders(accountToken, roleToken, cookie),
  });
  if (status >= 400 || !statusOk(json)) {
    throw new Error(json?.message || json?.msg || text || '读取明日方舟寻访记录失败');
  }
  return json?.data || {};
}

async function akAllHistory(opts) {
  const out = [];
  let cursor = { gachaTs: '', pos: '' };
  for (let page = 0; page < 1000; page++) {
    const data = await akHistoryPage({ ...opts, ...cursor });
    const list = data.gachaList || data.list || [];
    if (!list.length) break;
    out.push(...list);
    if (!data.hasMore) break;
    const last = list[list.length - 1];
    const next = { gachaTs: String(last.gachaTs || ''), pos: last.pos };
    if (!next.gachaTs || next.pos === undefined || next.pos === null) break;
    if (next.gachaTs === cursor.gachaTs && String(next.pos) === String(cursor.pos)) break;
    cursor = next;
  }
  return out;
}

function mapArknights(records, binding) {
  const rows = [];
  for (const record of records) {
    const stars = Number(record.rarity) + 1;
    if (!Number.isFinite(stars)) continue;
    const type = arknightsType(record.__categoryName || record.poolName, record.poolId);
    rows.push({
      id: `ak_${record.gachaTs}_${record.pos}_${record.charId || ''}`,
      uid: String(binding.uid || ''),
      gachaType: type,
      uigfType: type,
      itemId: String(record.charId || ''),
      itemType: '干员',
      count: 1,
      time: cnTime(record.gachaTs),
      name: String(record.charName || ''),
      rank: stars,
      rarity: stars,
      pity: null,
      pityGroup: type === 'limited' ? `limited:${record.poolId || record.poolName || ''}` : type,
      poolName: String(record.poolName || ''),
      source: 'official',
      synthetic: false,
      sort: String(record.pos ?? ''),
    });
  }
  const all = rows.filter((row) => row.time && row.name).sort(compareRows);
  const { records: top, pity } = topRecordsFromAll(all, 6, (row, value) => ({
    ...row,
    rank: 5,
    rarity: 6,
    pity: value,
  }));
  const perType = {};
  const poolNames = {};
  const daily = {};
  for (const row of all) {
    perType[row.gachaType] = perType[row.gachaType] || { total: 0, five: 0 };
    perType[row.gachaType].total++;
    const day = String(row.time || '').slice(0, 10);
    if (day) daily[`${day}|${row.gachaType}`] = (daily[`${day}|${row.gachaType}`] || 0) + 1;
    if (row.gachaType === 'limited') poolNames.limited = poolNames.limited || row.poolName || '限定寻访';
  }
  for (const row of top) {
    perType[row.gachaType] = perType[row.gachaType] || { total: 0, five: 0 };
    perType[row.gachaType].five++;
    if (row.poolName && !poolNames[row.gachaType]) poolNames[row.gachaType] = row.poolName;
  }
  return {
    records: top,
    totals: {
      exact: all.length,
      perType,
      currentPity: pity,
      daily,
      start: all[0]?.time || null,
      end: all[all.length - 1]?.time || null,
      partial: true,
      partialMessage: '明日方舟官方寻访记录只保留约 90 天，窗口外记录需要靠历史汇总补录。',
      fetchedAt: new Date().toISOString(),
    },
    poolNames,
    binding,
  };
}

export async function syncArknights() {
  const binding = pickBinding('arknights');
  const webToken = await grantWebToken();
  const roleToken = await getRoleToken(binding.uid, webToken);
  const cookie = await akLoginCookie(roleToken);
  const categories = await akCategories(binding.uid, roleToken, hypergryphSession.userToken, cookie);
  const all = [];
  for (const category of categories) {
    const records = await akAllHistory({
      uid: binding.uid,
      category: category.id ?? category.cateId,
      roleToken,
      accountToken: hypergryphSession.userToken,
      cookie,
    });
    for (const record of records) record.__categoryName = category.name || category.cateName || '';
    all.push(...records);
  }
  // 同一批数据可能被多个类别重复返回，按游标去重。
  const seen = new Set();
  const unique = [];
  for (const record of all) {
    const key = `${record.gachaTs}|${record.pos}|${record.charId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(record);
  }
  const mapped = mapArknights(unique, binding);
  for (const category of categories) {
    const name = String(category.name || category.cateName || '').trim();
    if (!name) continue;
    mapped.poolNames[arknightsType(name, category.id ?? category.cateId)] = name;
  }
  return {
    ...mapped,
    game: 'arknights',
    gameName: GAMES.arknights?.name || '明日方舟',
    totalFetched: mapped.totals.exact,
    categories: categories.map((c) => ({ id: String(c.id ?? c.cateId ?? ''), name: c.name || c.cateName || '' })),
  };
}

async function efGet(provider, pathname, params, token) {
  const base = provider === 'gryphline' ? EF_GLOBAL : EF_CN;
  const query = new URLSearchParams({ lang: 'zh-cn', token, ...params });
  const { status, json, text } = await request(`${base}${pathname}?${query.toString()}`, {
    headers: { Origin: provider === 'gryphline' ? 'https://game.gryphline.com' : 'https://game.hypergryph.com' },
  });
  if (status >= 400 || !isZeroCode(json?.code)) {
    throw new Error(json?.msg || json?.message || text || `终末地接口返回 ${status}`);
  }
  return json.data || {};
}

async function efQueryRole(provider, token, serverId) {
  const host = provider === 'gryphline' ? 'https://u8.gryphline.com' : 'https://u8.hypergryph.com';
  try {
    const { status, json } = await request(`${host}/game/role/v1/query_role_list`, {
      method: 'POST',
      body: { token, serverId },
    });
    if (status >= 400 || json?.status !== 0) return null;
    const roles = Array.isArray(json?.data?.roles) ? json.data.roles : [];
    const role = roles.find((r) => String(r.serverId || '') === String(serverId)) || roles[0] || {};
    return {
      uid: String(json?.data?.uid || ''),
      roleId: String(role.roleId || ''),
      nickname: String(role.nickname || role.nickName || ''),
      serverName: String(role.serverName || ''),
    };
  } catch {
    return null;
  }
}

async function efAllCharRecords(provider, token, serverId) {
  let tabs = [];
  try {
    const meta = await efGet(provider, '/api/record/char/meta', { server_id: serverId }, token);
    tabs = Array.isArray(meta.tabs) ? meta.tabs : [];
  } catch { /* fall back to known types */ }
  if (!tabs.length) {
    tabs = ['E_CharacterGachaPoolType_Special', 'E_CharacterGachaPoolType_Rerun', 'E_CharacterGachaPoolType_Joint', 'E_CharacterGachaPoolType_Standard', 'E_CharacterGachaPoolType_Beginner']
      .map((poolType) => ({ poolType }));
  }
  const poolTypes = [];
  for (const tab of tabs) {
    const poolType = String(tab?.poolType || tab?.pool_type || '').trim();
    if (poolType && !poolTypes.includes(poolType)) poolTypes.push(poolType);
  }
  const out = [];
  for (const poolType of poolTypes) {
    let seqId = '';
    for (let page = 0; page < 1000; page++) {
      const params = { server_id: serverId, pool_type: poolType };
      if (seqId) params.seq_id = seqId;
      const data = await efGet(provider, '/api/record/char', params, token);
      const list = Array.isArray(data.list) ? data.list : Array.isArray(data.gachaList) ? data.gachaList : [];
      for (const row of list) out.push({ ...row, __poolType: poolType });
      if (!data.hasMore || !list.length) break;
      const next = String(list[list.length - 1]?.seqId || '');
      if (!next || next === seqId) break;
      seqId = next;
    }
  }
  return out;
}

async function efWeaponPools(provider, token, serverId) {
  const data = await efGet(provider, '/api/record/weapon/pool', { server_id: serverId }, token);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.list) ? data.list : [];
}

async function efWeaponRecords(provider, token, serverId, poolId, poolIds = []) {
  const out = [];
  let seqId = '';
  const mergedPools = Array.isArray(poolIds) && poolIds.length > 0;
  for (let page = 0; page < 1000; page++) {
    const params = { server_id: serverId };
    if (mergedPools) params.pool_ids = poolIds.join(',');
    else params.pool_id = poolId;
    if (seqId) params.seq_id = seqId;
    const data = await efGet(provider, '/api/record/weapon', params, token);
    const list = Array.isArray(data.list) ? data.list : Array.isArray(data.gachaList) ? data.gachaList : [];
    for (const row of list) out.push({ ...row, __poolId: row.poolId || poolId });
    if (!data.hasMore || !list.length) break;
    const next = String(list[list.length - 1]?.seqId || '');
    if (!next || next === seqId) break;
    seqId = next;
  }
  return out;
}

function efWeaponType(poolId, poolType) {
  const text = `${poolId || ''} ${poolType || ''}`.toLowerCase();
  if (text.includes('rerun')) return 'weapon_rerun';
  if (text.includes('constant')) return 'weapon_constant';
  return 'weapon_special';
}

async function efPoolUpIds(provider, token, serverId, poolId) {
  const key = `${provider}|${serverId}|${poolId}`;
  if (endfieldContentCache.has(key)) return endfieldContentCache.get(key);
  let ids = [];
  try {
    const data = await efGet(provider, '/api/content', { server_id: serverId, pool_id: poolId }, token);
    const pool = data.pool || {};
    const all = Array.isArray(pool.all) ? pool.all : [];
    const names = new Set();
    if (pool.up6_id) ids.push(String(pool.up6_id));
    for (const value of [pool.up6_name, pool.up6_item_name]) {
      const name = String(value || '').replace(/的信物$/, '').trim();
      if (name) names.add(name);
    }
    for (const item of [...(pool.rotate_list || []), ...(pool.rotate_reward_item_list || [])]) {
      if (!item) continue;
      const name = String(item?.name || item?.itemName || (typeof item === 'string' ? item : '')).replace(/的信物$/, '').trim();
      if (name) names.add(name);
    }
    if (names.size) {
      const matches = all.filter((item) => names.has(String(item.name || '').trim()));
      const sixStar = matches.filter((item) => Number(item.rarity) === 6);
      for (const item of sixStar.length ? sixStar : matches) {
        if (item.id) ids.push(String(item.id));
      }
    }
    ids = [...new Set(ids.filter(Boolean))];
  } catch { /* metadata is optional */ }
  if (ids.length) endfieldContentCache.set(key, ids);
  return ids;
}

function mapEndfield(charRows, weaponRows, provider) {
  const rows = [];
  for (const record of charRows) {
    if (String(record.kind || '').startsWith('gift')) continue;
    const rarity = Number(record.rarity) || 0;
    const poolType = String(record.__poolType || record.poolType || '');
    const type = {
      E_CharacterGachaPoolType_Special: 'char_special',
      E_CharacterGachaPoolType_Rerun: 'char_rerun',
      E_CharacterGachaPoolType_Joint: 'char_joint',
      E_CharacterGachaPoolType_Standard: 'char_standard',
      E_CharacterGachaPoolType_Beginner: 'char_beginner',
    }[poolType] || `char_${poolType.toLowerCase()}`;
    const poolId = String(record.poolId || '');
    rows.push({
      id: `efc_${record.seqId || record.gachaTs}_${record.charId || ''}`,
      uid: '',
      gachaType: type,
      uigfType: type,
      itemId: String(record.charId || ''),
      itemType: '干员',
      count: 1,
      time: cnTime(record.gachaTs),
      name: String(record.charName || record.name || ''),
      rank: rarity,
      rarity,
      pity: null,
      pityGroup: type === 'char_joint' ? `char_joint:${poolId}` : type,
      poolName: String(record.poolName || ''),
      isFree: Boolean(record.isFree),
      source: 'official',
      synthetic: false,
      sort: String(record.seqId || ''),
      poolId,
    });
  }
  for (const record of weaponRows) {
    if (String(record.kind || '').startsWith('gift')) continue;
    const rarity = Number(record.rarity) || 0;
    const type = efWeaponType(record.__poolId || record.poolId, record.poolType);
    const poolId = String(record.poolId || record.__poolId || '');
    rows.push({
      id: `efw_${record.seqId || record.gachaTs}_${record.weaponId || ''}`,
      uid: '',
      gachaType: type,
      uigfType: type,
      itemId: String(record.weaponId || ''),
      itemType: '武器',
      count: 1,
      time: cnTime(record.gachaTs),
      name: String(record.weaponName || record.name || ''),
      rank: rarity,
      rarity,
      pity: null,
      pityGroup: `${type}:${poolId}`,
      poolName: String(record.poolName || ''),
      isFree: false,
      source: 'official',
      synthetic: false,
      sort: String(record.seqId || ''),
      poolId,
    });
  }
  const all = rows.filter((row) => row.time && row.name).sort(compareRows);
  const { records: top, pity } = topRecordsFromAll(all, 6, (row, value) => ({
    ...row,
    rank: 5,
    rarity: 6,
    pity: value,
  }));
  const perType = {};
  const daily = {};
  for (const row of all) {
    perType[row.gachaType] = perType[row.gachaType] || { total: 0, five: 0 };
    perType[row.gachaType].total++;
    const day = String(row.time || '').slice(0, 10);
    if (day) daily[`${day}|${row.gachaType}`] = (daily[`${day}|${row.gachaType}`] || 0) + 1;
  }
  const poolNames = {
    char_special: '特许寻访',
    char_rerun: '重构寻访',
    char_joint: '辉光庆典',
    char_standard: '基础寻访',
    char_beginner: '启程寻访',
    weapon_special: '限定申领',
    weapon_constant: '常驻申领',
    weapon_rerun: '重构申领',
  };
  for (const row of top) {
    perType[row.gachaType] = perType[row.gachaType] || { total: 0, five: 0 };
    perType[row.gachaType].five++;
    if (row.poolName && !poolNames[row.gachaType]) poolNames[row.gachaType] = row.poolName;
  }
  return {
    records: top,
    totals: {
      exact: all.length,
      perType,
      currentPity: pity,
      daily,
      start: all[0]?.time || null,
      end: all[all.length - 1]?.time || null,
      partial: true,
      partialMessage: '终末地官方寻访记录只保留约 90 天，窗口外记录需要靠历史汇总补录。',
      fetchedAt: new Date().toISOString(),
    },
    poolNames,
    provider,
  };
}

async function efApplyUpFlags(mapped, provider, token, serverId) {
  const pools = new Map();
  for (const row of mapped.records) {
    if (!row.poolId) continue;
    if (!pools.has(row.poolId)) pools.set(row.poolId, []);
    pools.get(row.poolId).push(row);
  }
  for (const [poolId, rows] of pools) {
    const type = rows[0]?.gachaType || '';
    if (!['char_special', 'char_rerun', 'char_joint', 'weapon_special', 'weapon_constant', 'weapon_rerun'].includes(type)) continue;
    const upIds = await efPoolUpIds(provider, token, serverId, poolId);
    if (!upIds.length) continue;
    for (const row of rows) row.up = upIds.includes(String(row.itemId)) ? 'win' : 'loss';
  }
  return mapped;
}

async function efFetchWeaponRows(provider, token, serverId, pools) {
  const weaponRows = [];
  const rerunPools = [];
  for (const pool of pools) {
    const poolId = String(pool.poolId || '').trim();
    if (!poolId) continue;
    if (efWeaponType(poolId, pool.poolType) === 'weapon_rerun') {
      rerunPools.push(pool);
      continue;
    }
    const rows = await efWeaponRecords(provider, token, serverId, poolId);
    for (const row of rows) {
      row.poolName = row.poolName || pool.poolName || '';
      row.poolType = row.poolType || pool.poolType || '';
    }
    weaponRows.push(...rows);
  }
  if (rerunPools.length) {
    const ids = rerunPools.map((pool) => String(pool.poolId || '').trim()).filter(Boolean);
    const rows = await efWeaponRecords(provider, token, serverId, '', ids);
    const byPool = new Map(rerunPools.map((pool) => [String(pool.poolId || '').trim(), pool]));
    for (const row of rows) {
      const pool = byPool.get(String(row.poolId || row.__poolId || '').trim());
      row.poolName = row.poolName || pool?.poolName || '';
      row.poolType = row.poolType || pool?.poolType || '';
      weaponRows.push(row);
    }
  }
  return weaponRows;
}

export async function syncEndfield() {
  const binding = pickBinding('endfield');
  const webToken = await grantWebToken();
  const roleToken = await getRoleToken(binding.uid, webToken);
  const serverId = String(binding.roles?.[0]?.serverId || '1');
  const provider = 'hypergryph';
  const charRows = await efAllCharRecords(provider, roleToken, serverId);
  const pools = await efWeaponPools(provider, roleToken, serverId);
  const weaponRows = await efFetchWeaponRows(provider, roleToken, serverId, pools);
  const mapped = mapEndfield(charRows, weaponRows, provider);
  mapped.uid = binding.uid;
  mapped.nickname = binding.nickname;
  mapped.role = binding.roles?.[0] || null;
  await efApplyUpFlags(mapped, provider, roleToken, serverId);
  return {
    ...mapped,
    game: 'endfield',
    gameName: GAMES.endfield?.name || '明日方舟：终末地',
    totalFetched: mapped.totals.exact,
  };
}

export function parseEndfieldUrl(rawUrl) {
  const url = new URL(String(rawUrl || '').trim());
  if (!/^https?:$/.test(url.protocol)) throw new Error('链接格式不正确');
  if (!/ef-webview\.(hypergryph|gryphline)\.com$/i.test(url.hostname)) throw new Error('这不是终末地抽卡记录链接');
  const token = url.searchParams.get('u8_token') || url.searchParams.get('token') || '';
  const rawServer = url.searchParams.get('server_id') || url.searchParams.get('server') || url.searchParams.get('serverId') || url.searchParams.get('serverid') || '';
  if (!token) throw new Error('链接里没有 u8_token');
  const provider = url.hostname.includes('gryphline') ? 'gryphline' : 'hypergryph';
  if (provider === 'gryphline' && !rawServer) throw new Error('国际服链接缺少 server_id');
  return { provider, token, serverId: String(rawServer || '1'), url: url.toString() };
}

export function findEndfieldLogUrls(home = os.homedir()) {
  const candidates = [
    path.join(home, 'AppData', 'LocalLow', 'Hypergryph', 'Endfield', 'sdklogs', 'HGWebview.log'),
    path.join(home, 'AppData', 'LocalLow', 'Gryphline', 'Endfield', 'sdklogs', 'HGWebview.log'),
  ];
  const urls = [];
  const diagnostics = [];
  for (const file of candidates) {
    if (!fs.existsSync(file)) {
      diagnostics.push({ path: file, exists: false });
      continue;
    }
    diagnostics.push({ path: file, exists: true });
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch (e) {
      diagnostics.push({ path: file, error: e.message });
      continue;
    }
    for (const match of text.matchAll(/https:\/\/ef-webview\.(?:hypergryph|gryphline)\.com\/page\/gacha_[^\s"'<>]+/g)) {
      urls.push(match[0].replace(/&amp;/g, '&').replace(/\\u0026/gi, '&'));
    }
  }
  return { urls: [...new Set(urls)].slice(-5), diagnostics };
}

export async function syncEndfieldFromUrl(rawUrl) {
  const parsed = parseEndfieldUrl(rawUrl);
  const role = await efQueryRole(parsed.provider, parsed.token, parsed.serverId);
  const charRows = await efAllCharRecords(parsed.provider, parsed.token, parsed.serverId);
  const pools = await efWeaponPools(parsed.provider, parsed.token, parsed.serverId);
  const weaponRows = await efFetchWeaponRows(parsed.provider, parsed.token, parsed.serverId, pools);
  const mapped = mapEndfield(charRows, weaponRows, parsed.provider);
  mapped.uid = role?.uid || '';
  mapped.nickname = role?.nickname || '';
  mapped.role = role;
  await efApplyUpFlags(mapped, parsed.provider, parsed.token, parsed.serverId);
  return {
    ...mapped,
    game: 'endfield',
    gameName: GAMES.endfield?.name || '明日方舟：终末地',
    totalFetched: mapped.totals.exact,
  };
}

// ---------------- 塔吉多 / 异环 ----------------

function tajiduoStatus() {
  return {
    connected: Boolean(tajiduoSession?.refreshToken),
    user: tajiduoSession
      ? { uid: tajiduoSession.uid, nickname: tajiduoSession.roleName || '', roleId: tajiduoSession.roleId || '' }
      : null,
    updatedAt: tajiduoSession?.updatedAt || null,
    lastError: lastTajiduoError,
  };
}

function laohuDeviceId() {
  return `HT${crypto.randomBytes(7).toString('hex').toUpperCase()}`;
}

function laohuSign(params) {
  const raw = Object.keys(params).sort().map((key) => String(params[key] ?? '')).join('') + TAJIDUO_SECRET;
  return crypto.createHash('md5').update(raw, 'utf8').digest('hex');
}

function laohuEncrypt(text) {
  const key = Buffer.from(TAJIDUO_SECRET.slice(-16), 'utf8');
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  return Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]).toString('base64');
}

function laohuCommon(deviceId, millis = false) {
  const now = Date.now();
  const base = {
    deviceType: 'LGE-AN10',
    deviceId,
    deviceName: 'LGE-AN10',
    deviceSys: '12',
    deviceModel: 'LGE-AN10',
    sdkVersion: '4.129.0',
    bid: 'com.pwrd.htassistant',
    channelId: '1',
    appId: TAJIDUO_APP_ID,
    t: String(millis ? now : Math.floor(now / 1000)),
  };
  if (millis) base.version = '1';
  else base.versionCode = '1';
  return base;
}

function tajiduoDs() {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 8; i++) nonce += alphabet[crypto.randomInt(alphabet.length)];
  const digest = crypto.createHash('md5').update(`${timestamp}${nonce}${TAJIDUO_APP_VERSION}${TAJIDUO_DS_SECRET}`, 'utf8').digest('hex');
  return `${timestamp},${nonce},${digest}`;
}

function tajiduoHeaders(accessToken, uid, deviceId) {
  return {
    Accept: 'application/json',
    platform: 'android',
    authorization: accessToken,
    uid: String(uid || '0'),
    deviceid: deviceId,
    appversion: TAJIDUO_APP_VERSION,
    ds: tajiduoDs(),
    'User-Agent': TAJIDUO_OKHTTP_UA,
  };
}

async function laohuPost(pathname, data) {
  const body = { ...data };
  body.sign = laohuSign(body);
  const { status, json, text } = await request(`${LAOHU_BASE}${pathname}`, {
    method: 'POST',
    form: true,
    body,
    headers: { platform: 'android', 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (status >= 400) throw new Error(json?.message || json?.msg || String(text || '').slice(0, 160) || `老虎账号接口返回 ${status}`);
  if (!isZeroCode(json?.code)) throw new Error(json?.message || json?.msg || String(text || '').slice(0, 160) || '老虎账号接口返回错误');
  return json.result || json.data || {};
}

export async function sendTajiduoCaptcha(phone, deviceId = laohuDeviceId()) {
  const normalized = String(phone || '').replace(/\D/g, '');
  if (!/^1\d{10}$/.test(normalized)) throw new Error('请输入正确的 11 位手机号');
  const data = laohuCommon(deviceId);
  data.cellphone = normalized;
  data.areaCodeId = '1';
  data.type = '16';
  try {
    await laohuPost('/m/newApi/sendPhoneCaptchaWithOutLogin', data);
  } catch (e) {
    await recordTajiduoError('captcha', e);
    throw new Error(`发送验证码失败：${e.message}`);
  }
  return { deviceId };
}

export async function loginTajiduo(phone, code, deviceId) {
  const normalized = String(phone || '').replace(/\D/g, '');
  const captcha = String(code || '').trim();
  if (!/^1\d{10}$/.test(normalized)) throw new Error('请输入正确的 11 位手机号');
  if (!/^\d{4,8}$/.test(captcha)) throw new Error('请输入正确的短信验证码');
  if (!deviceId) throw new Error('请先获取短信验证码，再完成登录');
  const device = String(deviceId);
  const data = laohuCommon(device, true);
  data.areaCodeId = '1';
  data.idfa = '';
  data.adm = '';
  data.mac = '';
  data.cellphone = laohuEncrypt(normalized);
  data.captcha = laohuEncrypt(captcha);
  data.type = '16';
  let result;
  try {
    result = await laohuPost('/openApi/sms/new/login', data);
  } catch (e) {
    await recordTajiduoError('laohu-login', e);
    throw new Error(`老虎账号登录失败：${e.message}`);
  }
  const token = String(result.token || '');
  const userId = String(result.userId || '');
  if (!token || !userId) throw new Error('老虎账号登录没有返回 token/userId');
  let account = null;
  const ucErrors = [];
  for (const mode of ['form', 'json']) {
    const uc = await request(`${TAJIDUO_BASE}/usercenter/api/login`, {
      method: 'POST',
      form: mode === 'form',
      body: { token, userIdentity: userId, appId: TAJIDUO_USER_CENTER_APP_ID },
      headers: {
        Accept: 'application/json, text/plain, */*',
        platform: 'android',
        deviceId: device,
        Authorization: '',
        appVersion: TAJIDUO_APP_VERSION,
        uid: '0',
        'debug-uid': '3',
        ds: tajiduoDs(),
        'User-Agent': TAJIDUO_OKHTTP_UA,
      },
    });
    if (uc.status < 400 && isZeroCode(uc.json?.code)) {
      account = uc.json?.data || {};
      break;
    }
    ucErrors.push(`${mode}: ${uc.json?.msg || uc.json?.message || `HTTP ${uc.status}`}`);
  }
  if (!account) {
    const error = new Error(`塔吉多用户中心登录失败：${ucErrors.join('；') || '未知错误'}`);
    await recordTajiduoError('usercenter-login', error);
    throw error;
  }
  if (!account.accessToken || !account.refreshToken) throw new Error('塔吉多登录没有返回 accessToken/refreshToken');
  tajiduoSession = {
    refreshToken: String(account.refreshToken),
    accessToken: String(account.accessToken),
    accessTokenAt: Date.now(),
    uid: String(account.uid || userId),
    centerUid: String(account.uid || userId),
    deviceId: device,
    roleId: '',
    roleName: '',
    updatedAt: new Date().toISOString(),
  };
  lastTajiduoError = null;
  await persist(TAJIDUO_SESSION_FILE, tajiduoSession);
  return tajiduoStatus();
}

async function tajiduoRefresh() {
  if (!tajiduoSession?.refreshToken) throw new Error('塔吉多尚未登录');
  const res = await request(`${TAJIDUO_BASE}/usercenter/api/refreshToken`, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      platform: 'android',
      deviceId: tajiduoSession.deviceId,
      Authorization: tajiduoSession.refreshToken,
      appVersion: TAJIDUO_APP_VERSION,
      uid: String(tajiduoSession.uid || '0'),
      'debug-uid': '3',
      ds: tajiduoDs(),
      'User-Agent': TAJIDUO_OKHTTP_UA,
    },
  });
  const code = Number(res.json?.code);
  if (res.status === 401 || res.status === 402 || res.status === 403 || code === 401 || code === 402 || code === 403) {
    throw Object.assign(new Error('塔吉多登录已失效，请重新登录'), { code: 'AUTH_EXPIRED' });
  }
  if (res.status >= 400 || !isZeroCode(res.json?.code)) {
    throw new Error(res.json?.msg || res.json?.message || '塔吉多刷新登录失败');
  }
  const data = res.json?.data || {};
  if (!data.accessToken || !data.refreshToken) throw new Error('塔吉多刷新登录没有返回新凭据');
  tajiduoSession.accessToken = String(data.accessToken);
  tajiduoSession.refreshToken = String(data.refreshToken);
  tajiduoSession.accessTokenAt = Date.now();
  if (data.uid) tajiduoSession.uid = String(data.uid);
  tajiduoSession.updatedAt = new Date().toISOString();
  await persist(TAJIDUO_SESSION_FILE, tajiduoSession);
  return tajiduoSession.accessToken;
}

async function tajiduoAccess() {
  if (!tajiduoSession?.refreshToken) throw new Error('塔吉多尚未登录');
  if (tajiduoSession.accessToken && Date.now() - Number(tajiduoSession.accessTokenAt || 0) < 30 * 60 * 1000) {
    return tajiduoSession.accessToken;
  }
  return tajiduoRefresh();
}

async function tajiduoRoles(retry = true) {
  const accessToken = await tajiduoAccess();
  const { status, json, text } = await request(`${TAJIDUO_BASE}/usercenter/api/v2/getGameRoles?gameId=${NTE_GAME_ID}`, {
    headers: {
      Accept: 'application/json',
      platform: 'android',
      authorization: accessToken,
      uid: String(tajiduoSession.uid || '0'),
      deviceid: tajiduoSession.deviceId,
      appversion: TAJIDUO_APP_VERSION,
      ds: tajiduoDs(),
      'User-Agent': TAJIDUO_OKHTTP_UA,
    },
  });
  const bodyCode = Number(json?.code);
  if ((status === 401 || status === 402 || status === 403 || [401, 402, 403].includes(bodyCode)) && retry) {
    await tajiduoRefresh();
    return tajiduoRoles(false);
  }
  if (status === 401 || status === 402 || status === 403 || [401, 402, 403].includes(bodyCode)) {
    throw Object.assign(new Error('塔吉多登录已失效，请重新登录'), { code: 'AUTH_EXPIRED' });
  }
  if (status >= 400 || !isZeroCode(json?.code)) throw new Error(json?.msg || json?.message || text || '读取异环角色失败');
  const data = json?.data || {};
  if (Array.isArray(data)) return { roles: data, bindRole: 0 };
  return { roles: data.roles || [], bindRole: Number(data.bindRole) || 0 };
}

async function tajiduoGet(pathname, query = {}, retry = true) {
  const accessToken = await tajiduoAccess();
  const params = new URLSearchParams({ ...query });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const { status, json, text } = await request(`${TAJIDUO_BASE}${pathname}${suffix}`, {
    headers: tajiduoHeaders(accessToken, tajiduoSession.uid, tajiduoSession.deviceId),
  });
  const bodyCode = Number(json?.code);
  if ((status === 401 || status === 402 || status === 403 || [401, 402, 403].includes(bodyCode)) && retry) {
    await tajiduoRefresh();
    return tajiduoGet(pathname, query, false);
  }
  if (status === 401 || status === 402 || status === 403 || [401, 402, 403].includes(bodyCode)) {
    throw Object.assign(new Error('塔吉多登录已失效，请重新登录'), { code: 'AUTH_EXPIRED' });
  }
  if (status >= 400 || !isZeroCode(json?.code)) throw new Error(json?.msg || json?.message || text || `塔吉多接口返回 ${status}`);
  return json?.data || {};
}

function ntePoolType(tab) {
  const text = String(tab || '');
  if (/限定/.test(text)) return 'limited';
  if (/常驻/.test(text)) return 'permanent';
  if (/弧盘|武器/.test(text)) return 'weapon';
  return 'permanent';
}

function mapNte(summary, names, role) {
  const pools = Array.isArray(summary.gachaDetails) ? summary.gachaDetails : [];
  const rows = [];
  const perType = {};
  const poolNames = {};
  let exact = 0;
  for (const pool of pools) {
    const type = ntePoolType(pool.tab);
    const total = Number(pool.drawCount) || 0;
    exact += total;
    perType[type] = perType[type] || { total: 0, five: 0 };
    perType[type].total += total;
    poolNames[type] = String(pool.tab || '') || poolNames[type] || '';
    for (const detail of pool.details || []) {
      const itemId = String(detail.charid || '');
      const value = Number(detail.rareCount) || 0;
      const time = cnTime(detail.timeStamp || detail.time);
      if (!itemId || !time) continue;
      const resolvedName = detail.name || detail.charName || names.get(itemId);
      const name = String(resolvedName || `${type === 'weapon' ? '弧盘' : '角色'} ${itemId}`);
      perType[type].five++;
      rows.push({
        id: `nte_${type}_${time}_${itemId}_${value}`,
        uid: String(summary.roleid || role?.roleId || ''),
        gachaType: type,
        uigfType: type,
        itemId,
        itemType: type === 'weapon' ? '弧盘' : '角色',
        count: 1,
        time,
        name,
        nameIsFallback: !resolvedName,
        rank: 5,
        rarity: 5,
        pity: value,
        poolName: String(pool.tab || ''),
        // 官方没有返回“本次 S 是否为 UP”的字段；限定池“出 S 必 UP”只是社区口径，先不自动判 win。
        up: null,
        source: 'official',
        synthetic: false,
      });
    }
  }
  rows.sort((a, b) => b.time.localeCompare(a.time));
  return {
    records: rows,
    totals: {
      exact,
      coverage: exact,
      exactUnknown: true,
      perType,
      currentPity: {},
      currentPityUnknown: true,
      start: rows[rows.length - 1]?.time || null,
      end: rows[0]?.time || null,
      partial: true,
      partialMessage: '异环官方只返回已出 S 的区间抽数；这里的数字是已覆盖抽数，不是账号完整总抽数。未出 S 的垫抽和窗口外记录没有接口。',
      fetchedAt: new Date().toISOString(),
    },
    poolNames,
    uid: String(summary.roleid || role?.roleId || ''),
    nickname: String(summary.rolename || role?.roleName || ''),
    role,
  };
}

export async function syncNte() {
  if (!tajiduoSession?.refreshToken) throw new Error('塔吉多尚未登录');
  const { roles, bindRole } = await tajiduoRoles();
  const role = roles.find((item) => String(item.roleId || '') === String(tajiduoSession.roleId || ''))
    || roles.find((item) => String(item.roleId || '') === String(bindRole || ''))
    || roles[0] || null;
  if (!role?.roleId) throw new Error('塔吉多账号没有绑定异环角色');
  tajiduoSession.roleId = String(role.roleId);
  tajiduoSession.roleName = String(role.roleName || role.nickname || '');
  const summary = await tajiduoGet('/apihub/awapi/yh/gacha');
  const names = new Map();
  try {
    const home = await tajiduoGet('/apihub/awapi/yh/roleHome', { roleId: tajiduoSession.roleId });
    for (const character of home.characters || []) {
      if (character.id && character.name) names.set(String(character.id), String(character.name));
    }
  } catch { /* names are optional */ }
  try {
    const characters = await tajiduoGet('/apihub/awapi/yh/characters', { roleId: tajiduoSession.roleId });
    const list = Array.isArray(characters) ? characters : Array.isArray(characters?.list) ? characters.list : [];
    for (const character of list) {
      if (character.id && character.name) names.set(String(character.id), String(character.name));
      if (character.fork?.id && character.fork?.name) names.set(String(character.fork.id), String(character.fork.name));
    }
  } catch { /* equipped weapon names are optional */ }
  tajiduoSession.updatedAt = new Date().toISOString();
  await persist(TAJIDUO_SESSION_FILE, tajiduoSession);
  const mapped = mapNte(summary, names, role);
  return {
    ...mapped,
    game: 'nte',
    gameName: GAMES.nte?.name || '异环',
    totalFetched: mapped.totals.exact,
  };
}

export async function tajiduoLogout() {
  tajiduoSession = null;
  await persist(TAJIDUO_SESSION_FILE, null);
  return { connected: false };
}

export const __test = { cnTime, mapArknights, mapEndfield, mapNte, parseEndfieldUrl, arknightsType, ntePoolType };

export async function thirdPartyStatus() {
  let found = { urls: [], diagnostics: [] };
  try { found = findEndfieldLogUrls(); } catch { /* log access is optional */ }
  return {
    hypergryph: hypergryphStatus(),
    tajiduo: tajiduoStatus(),
    endfieldLog: found.urls.map((url) => {
      try {
        const parsed = parseEndfieldUrl(url);
        return { provider: parsed.provider, serverId: parsed.serverId, preview: `u8_token=${parsed.token.slice(0, 4)}***${parsed.token.slice(-3)}` };
      } catch {
        return { provider: '', serverId: '', preview: '无效链接' };
      }
    }),
  };
}
