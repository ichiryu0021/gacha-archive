import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DATA_DIR, ROOT, getGame } from '../config.js';
import { sleep, uid } from '../utils.js';

const sessions = new Map();
const SESSION_FILE = path.join(DATA_DIR, 'miyoushe-session.dat');
const QR_HEADERS = {
  'Content-Type': 'application/json',
  'x-rpc-app_id': 'bll8iq97cem8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Origin: 'https://www.miyoushe.com',
  Referer: 'https://www.miyoushe.com/',
};
const CN_UA = 'Mozilla/5.0 (Linux; Android 13; M2101K9C Build/TKQ1.220829.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 miHoYoBBS/2.109.0';

export function dpapi(mode, input) {
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'scripts', 'dpapi.ps1'), '-Mode', mode], { windowsHide: true });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d.toString('utf8'); });
    child.stderr.on('data', (d) => { err += d.toString('utf8'); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(out.trim()) : reject(new Error(err.trim() || 'DPAPI failed')));
    child.stdin.end(String(input));
  });
}

async function persistSession(session) {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const payload = JSON.stringify({
      cookies: [...session.cookies.entries()],
      user: session.user || null,
      createdAt: session.createdAt,
    });
    const encrypted = await dpapi('protect', payload);
    await fsp.writeFile(SESSION_FILE, encrypted, 'utf8');
  } catch (e) {
    console.error('[auth] save failed', e.message);
  }
}

export async function restoreMiyousheSession() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    const encrypted = await fsp.readFile(SESSION_FILE, 'utf8');
    const payload = JSON.parse(await dpapi('unprotect', encrypted));
    const session = {
      id: 'saved',
      deviceId: crypto.randomUUID(),
      cookies: new Map(payload.cookies || []),
      status: 'Confirmed',
      user: payload.user || null,
      createdAt: payload.createdAt || Date.now(),
    };
    if (!session.cookies.size) return null;
    sessions.set(session.id, session);
    try {
      const profile = await fetchProfile(session);
      if (profile.nickname) session.user.nickname = profile.nickname;
      if (profile.avatar) session.user.avatar = profile.avatar;
      if (profile.nickname || profile.avatar) await persistSession(session);
    } catch {}
    return { sessionId: session.id, status: 'Confirmed', user: session.user };
  } catch (e) {
    console.error('[auth] restore failed', e.message);
    return null;
  }
}

function parseSetCookies(res) {
  let lines = [];
  if (typeof res.headers.getSetCookie === 'function') lines = res.headers.getSetCookie();
  else {
    const raw = res.headers.get('set-cookie');
    if (raw) lines = raw.split(/,(?=\s*[^;=]+=)/);
  }
  const out = [];
  for (const line of lines) {
    const first = String(line).split(';')[0];
    const idx = first.indexOf('=');
    if (idx > 0) out.push([first.slice(0, idx).trim(), first.slice(idx + 1).trim()]);
  }
  return out;
}

function absorbCookies(session, res) {
  for (const [k, v] of parseSetCookies(res)) session.cookies.set(k, v);
}

function cookieHeader(session) {
  return [...session.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function ds2(query, body = '') {
  const salt = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs';
  const t = Math.floor(Date.now() / 1000);
  let r = Math.floor(Math.random() * 100001 + 100000);
  if (r === 100000) r = 642367;
  const q = query ? query.split('&').sort().join('&') : '';
  const b = body ? JSON.stringify(body, Object.keys(body).sort()) : '';
  const raw = `salt=${salt}&t=${t}&r=${r}&b=${b}&q=${q}`;
  return `${t},${r},${crypto.createHash('md5').update(raw, 'utf8').digest('hex')}`;
}

async function postJson(url, body, headers, session) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, ...(session ? { Cookie: cookieHeader(session) } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (session) absorbCookies(session, res);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function fetchProfile(session) {
  const uid = session.user?.aid || session.cookies.get('account_id_v2') || session.cookies.get('ltuid_v2') || session.cookies.get('account_id') || '';
  if (!uid) return { nickname: '', avatar: '' };
  const q = `gids=2&uid=${encodeURIComponent(uid)}`;
  const res = await fetch(`https://bbs-api.mihoyo.com/user/wapi/getUserFullInfo?${q}`, {
    headers: {
      Cookie: cookieHeader(session),
      DS: ds2(q),
      'x-rpc-client_type': '5',
      'x-rpc-app_version': '2.109.0',
      'User-Agent': CN_UA,
      Referer: 'https://www.miyoushe.com/',
      Origin: 'https://www.miyoushe.com',
    },
    signal: AbortSignal.timeout(12000),
  });
  const data = await res.json().catch(() => ({}));
  const info = data?.data?.user_info || data?.data?.userInfo || {};
  return {
    nickname: info.nickname || info.nick_name || info.account_name || '',
    avatar: info.avatar_url || info.avatar || info.avatar_hd || info.head_icon || info.head_url || '',
  };
}

export async function createQrSession() {
  const deviceId = crypto.randomUUID();
  const session = { id: `qr_${uid()}`, deviceId, cookies: new Map(), createdAt: Date.now(), status: 'Created' };
  const { data } = await postJson('https://passport-api.miyoushe.com/account/ma-cn-passport/web/createQRLogin', {}, {
    ...QR_HEADERS, 'x-rpc-device_id': deviceId,
  }, session);
  if (data.retcode !== 0 || !data.data?.url) {
    throw new Error(data.message || '无法生成米游社登录二维码，请稍后再试');
  }
  session.ticket = data.data.ticket;
  session.qrUrl = data.data.url;
  sessions.set(session.id, session);
  setTimeout(() => sessions.delete(session.id), 10 * 60 * 1000).unref();
  return { sessionId: session.id, url: session.qrUrl, expiresIn: 300 };
}

export async function pollQrSession(id) {
  const session = sessions.get(id);
  if (!session) throw new Error('二维码会话已过期，请重新生成');
  const { data } = await postJson('https://passport-api.miyoushe.com/account/ma-cn-passport/web/queryQRLoginStatus', { ticket: session.ticket }, {
    ...QR_HEADERS, 'x-rpc-device_id': session.deviceId,
  }, session);
  if (data.retcode === -3501) return { status: 'Expired', message: '二维码已过期，请刷新' };
  if (data.retcode === -3505) return { status: 'Cancelled', message: '已取消登录' };
  if (data.retcode !== 0) return { status: 'Error', message: data.message || `登录状态查询失败（${data.retcode}）` };
  session.status = data.data?.status || 'Created';
  if (session.status === 'Confirmed') {
    session.confirmedAt = Date.now();
    const info = data.data?.user_info || {};
    session.user = {
      aid: String(info.aid || info.account_id || ''),
      mid: String(info.mid || ''),
      nickname: info.nickname || info.account_name || '',
    };
    try {
      const profile = await fetchProfile(session);
      if (profile.nickname) session.user.nickname = profile.nickname;
      if (profile.avatar) session.user.avatar = profile.avatar;
    } catch {}
    await persistSession(session);
    // Some deployments only set the final cookie jar on a follow-up status request.
    if (![...session.cookies.keys()].some((k) => k.startsWith('cookie_token') || k.startsWith('ltoken'))) {
      await sleep(250);
      const follow = await postJson('https://passport-api.miyoushe.com/account/ma-cn-passport/web/queryQRLoginStatus', { ticket: session.ticket }, {
        ...QR_HEADERS, 'x-rpc-device_id': session.deviceId,
      }, session);
      if (follow.data.retcode === 0) session.status = follow.data.data?.status || session.status;
    }
  }
  return {
    status: session.status,
    message: session.status === 'Confirmed' ? '登录成功' : '',
    user: session.user || null,
    hasCookies: session.cookies.size > 0,
  };
}

function requireSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'Confirmed') throw new Error('请先完成米游社扫码登录');
  if (!session.cookies.size) throw new Error('登录成功但没有取得凭据，请重新扫码');
  return session;
}

async function getRoles(session, gameBiz) {
  const query = `game_biz=${encodeURIComponent(gameBiz)}`;
  const url = `https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?${query}`;
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader(session),
      'x-rpc-client_type': '5',
      'x-rpc-app_version': '2.109.0',
      'x-rpc-device_id': session.deviceId,
      DS: ds2(query),
      'User-Agent': CN_UA,
      Referer: 'https://webstatic.mihoyo.com',
      Origin: 'https://webstatic.mihoyo.com',
    },
    signal: AbortSignal.timeout(20000),
  });
  absorbCookies(session, res);
  const data = await res.json().catch(() => ({}));
  if (data.retcode !== 0) {
    const err = new Error(data.message || `获取游戏角色失败（${data.retcode}）`);
    err.retcode = data.retcode;
    throw err;
  }
  return data.data?.list || [];
}

export async function getRolesForGame(sessionId, gameId) {
  const session = requireSession(sessionId);
  const game = getGame(gameId);
  const roles = await getRoles(session, game.gameBiz.cn);
  return roles.map((r) => ({
    uid: String(r.game_uid || ''), region: r.region || '', nickname: r.nickname || '',
    level: r.level || 0, gameBiz: r.game_biz || game.gameBiz.cn,
    regionName: r.region_name || '', isOfficial: Boolean(r.is_official),
  }));
}

export async function generateAuthkey(sessionId, gameId, role) {
  const session = requireSession(sessionId);
  const game = getGame(gameId);
  const body = {
    game_biz: role?.gameBiz || game.gameBiz.cn,
    game_uid: String(role?.uid || ''),
    region: role?.region || '',
    auth_appid: 'webview_gacha',
  };
  if (!body.game_uid || !body.region) throw new Error('缺少游戏 UID / 区服');
  let lastMessage = '';
  for (const endpoint of [
    'https://api-takumi.miyoushe.com/binding/api/genAuthKeyByCookieToken',
    'https://api-takumi.mihoyo.com/binding/api/genAuthKeyByCookieToken',
  ]) {
    try {
      const { data } = await postJson(endpoint, body, {
        Cookie: cookieHeader(session),
        'x-rpc-client_type': '5',
        'x-rpc-app_version': '2.109.0',
        'x-rpc-app_id': 'bll8iq97cem8',
        'x-rpc-device_id': session.deviceId,
        'User-Agent': CN_UA,
        Referer: 'https://webstatic.mihoyo.com',
        Origin: 'https://webstatic.mihoyo.com',
        'Content-Type': 'application/json',
      }, session);
      if (data.retcode === 0 && data.data?.authkey) {
        return {
          authkey: data.data.authkey,
          signType: data.data.sign_type || 2,
          authkeyVer: data.data.authkey_ver || 1,
          role: body,
        };
      }
      lastMessage = `${data.message || '未知错误'}（${data.retcode}）`;
    } catch (e) { lastMessage = e.message; }
  }
  const err = new Error(`米游社没有签发抽卡链接：${lastMessage}`);
  err.code = 'GEN_AUTHKEY_FAILED';
  throw err;
}

export async function fetchZzzOfficialStats(sessionId) {
  const session = requireSession(sessionId);
  const url = 'https://act-api-takumi.mihoyo.com/event/nap_gacha_record/api/zzz/index';
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader(session),
      'User-Agent': QR_HEADERS['User-Agent'],
      Referer: 'https://act.mihoyo.com/zzz/event/gacha-record/index.html',
      Origin: 'https://act.mihoyo.com',
      Accept: 'application/json, text/plain, */*',
    },
    signal: AbortSignal.timeout(25000),
  });
  absorbCookies(session, res);
  const data = await res.json().catch(() => ({}));
  if (data.retcode !== 0) {
    const err = new Error(data.retcode === -100
      ? '米游社登录态未被官方统计工具接受，请重新扫码（或先打开一次官方调频统计页）'
      : `官方统计接口返回 ${data.message || data.retcode}`);
    err.code = 'ZZZ_STATS_FAILED';
    throw err;
  }
  return data.data || {};
}

const ZZZ_TYPES = {
  GACHA_TYPE_CHARACTER_UP: '2',
  GACHA_TYPE_CHARACTER_RETURN: '102',
  GACHA_TYPE_WEAPON_UP: '3',
  GACHA_TYPE_WEAPON_RETURN: '103',
  GACHA_TYPE_PERMANENT: '1',
  GACHA_TYPE_BANGBOO: '5',
};

async function zzzGet(session, path, params) {
  const url = new URL(`https://act-api-takumi.mihoyo.com/event/nap_gacha_record/api/zzz/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader(session),
      'User-Agent': QR_HEADERS['User-Agent'],
      Referer: 'https://act.mihoyo.com/zzz/event/gacha-record/index.html',
      Origin: 'https://act.mihoyo.com',
      Accept: 'application/json, text/plain, */*',
    },
    signal: AbortSignal.timeout(25000),
  });
  absorbCookies(session, res);
  const data = await res.json().catch(() => ({}));
  if (data.retcode !== 0) throw new Error(data.message || `官方调频接口 ${data.retcode}`);
  return data.data || {};
}

function zzzTime(ts) {
  const n = Number(ts);
  if (!n) return '';
  return new Date((n + 8 * 3600) * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

export async function fetchZzzFullHistory(sessionId, role) {
  const session = requireSession(sessionId);
  const roles = role ? [role] : await getRolesForGame(sessionId, 'zzz');
  const current = roles[0];
  if (!current?.uid || !current?.region) throw new Error('缺少绝区零 UID / 区服');
  const base = { uid: current.uid, region: current.region };
  const index = await zzzGet(session, 'index', base);
  const records = [];
  const seen = new Set();
  const perType = {};
  const currentPity = {};
  const add = (row, type, version = '') => {
    if (!row?.item_id || !row?.record_time) return;
    const id = `zzzfull_${type}_${row.record_time}_${row.item_id}`;
    if (seen.has(id)) return;
    seen.add(id);
    const itemType = row.item_type === 'ItemType_Weapon' ? '音擎' : row.item_type === 'ItemType_Bangboo' ? '邦布' : '代理人';
    const isLimited = ['2', '3', '102', '103'].includes(type);
    records.push({
      id: '',
      uid: current.uid,
      gachaType: type,
      uigfType: type,
      itemId: String(row.item_id),
      count: 1,
      time: zzzTime(row.record_time),
      name: row.name || '',
      itemType,
      rank: 5,
      lang: 'zh-cn',
      poolName: getGame('zzz').pools[type] || '调频',
      pity: Number(row.count) || null,
      up: isLimited ? (row.is_up ? 'win' : 'loss') : null,
      version: version || null,
      source: 'official-full',
      synthetic: true,
      sort: Number(row.sort) || 0,
    });
  };

  for (const stat of index.type_stats || []) {
    const type = ZZZ_TYPES[stat.gacha_type];
    if (!type) continue;
    perType[type] = { total: Number(stat.total_count) || 0, five: Number(stat.s_count) || 0 };
    currentPity[type] = Number(stat.next_s_cur_times) || 0;
    const versions = stat.has_data_vers || [];
    for (let i = 0; i < versions.length; i += 8) {
      const chunk = versions.slice(i, i + 8);
      const hist = await zzzGet(session, 'hist_pool_stat', { ...base, gacha_type: type, vers: chunk.join(',') });
      for (const pool of hist.list || []) for (const row of pool.cur_records || []) add(row, type, pool.version);
    }
    const cur = await zzzGet(session, 'cur_pool_stat', { ...base, gacha_type: type });
    for (const pool of cur.list || []) for (const row of pool.cur_records || []) add(row, type, pool.version);
  }

  records.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  for (const [type, stats] of Object.entries(perType)) {
    if (!currentPity[type]) {
      const counted = records
        .filter((r) => String(r.gachaType) === String(type))
        .reduce((sum, r) => sum + (Number(r.pity) || 0), 0);
      currentPity[type] = Math.max(0, (Number(stats.total) || 0) - counted);
    }
  }
  const totals = {
    exact: Number(index.total_gacha_count) || records.length,
    perType,
    currentPity,
    daily: {},
    start: records[0]?.time || null,
    end: records.at(-1)?.time || null,
    fetchedAt: new Date().toISOString(),
  };
  return { records, totals, role: current, totalS: Number(index.total_s_count) || records.length };
}

export async function getAllRoles(sessionId) {
  const result = { roles: {}, errors: {} };
  for (const game of ['genshin', 'hsr', 'zzz']) {
    try {
      result.roles[game] = await getRolesForGame(sessionId, game);
    } catch (e) {
      result.roles[game] = [];
      result.errors[game] = e.message;
    }
  }
  return result;
}

export function getSavedSessionInfo() {
  const session = sessions.get('saved');
  if (!session || session.status !== 'Confirmed') return null;
  return { sessionId: 'saved', status: 'Confirmed', user: session.user || null };
}

export function logoutSession(sessionId) {
  if (sessionId) sessions.delete(sessionId);
  try { fs.unlinkSync(SESSION_FILE); } catch {}
  return true;
}

export async function getSessionInfo(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  return { status: session.status, user: session.user || null, createdAt: session.createdAt };
}
