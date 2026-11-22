import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, getGame } from '../config.js';
import { dpapi } from './auth.js';

/**
 * HoYoLAB (international / HoYoverse global) login + authkey helper.
 *
 * Cookies come from a desktop login window (Electron partition). They are kept in
 * memory, optionally encrypted to data/hoyolab-session.dat with Windows DPAPI.
 * No password is ever handled here.
 */

const SESSION_FILE = path.join(DATA_DIR, 'hoyolab-session.dat');
const SESSION_ID = 'os_saved';
const ACCOUNT_BASE = 'https://api-account-os.hoyoverse.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

const OS_REGIONS = {
  genshin: ['os_usa', 'os_euro', 'os_asia', 'os_cht'],
  hsr: ['prod_official_usa', 'prod_official_eur', 'prod_official_asia', 'prod_official_cht'],
  zzz: ['prod_gf_us', 'prod_gf_eu', 'prod_gf_jp', 'prod_gf_sg'],
};

const COOKIE_NAMES = new Set([
  'cookie_token_v2', 'cookie_token',
  'account_id_v2', 'account_id', 'account_mid_v2',
  'ltoken_v2', 'ltoken', 'ltuid_v2', 'ltuid', 'ltmid_v2',
  'stoken_v2', 'stoken',
]);

const sessions = new Map();

function normalizeCookies(input) {
  const list = Array.isArray(input)
    ? input
    : Object.entries(input || {}).map(([name, value]) => ({ name, value }));
  const best = new Map();
  const rank = (domain) => {
    const d = String(domain || '').toLowerCase();
    if (d.includes('hoyoverse')) return 0;
    if (d.includes('mihoyo')) return 1;
    if (d.includes('hoyolab')) return 2;
    return 3;
  };
  for (const item of list) {
    const name = String(item?.name || item?.[0] || '');
    const value = String(item?.value ?? item?.[1] ?? '');
    if (!name || !value || !COOKIE_NAMES.has(name)) continue;
    const domain = String(item?.domain || '');
    const current = best.get(name);
    if (!current || rank(domain) < current.rank) best.set(name, { name, value, domain, rank: rank(domain) });
  }
  return best;
}

function cookieHeader(cookies) {
  return [...cookies.values()].map((c) => `${c.name}=${c.value}`).join('; ');
}

function hasLoginCookie(cookies) {
  return cookies.has('cookie_token_v2') || cookies.has('cookie_token');
}

function makeSession(cookies, user) {
  return {
    id: SESSION_ID,
    cookies,
    status: 'Confirmed',
    user: user || {
      nickname: '',
      aid: cookies.get('account_id_v2')?.value || cookies.get('account_id')?.value || '',
    },
    createdAt: Date.now(),
  };
}

function sessionInfo(session) {
  if (!session) return null;
  return { sessionId: session.id, status: 'Confirmed', user: session.user || null };
}

async function persistSession(session) {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const payload = JSON.stringify({
      cookies: [...session.cookies.values()].map((c) => ({ name: c.name, value: c.value, domain: c.domain })),
      user: session.user || null,
      createdAt: session.createdAt,
    });
    const encrypted = await dpapi('protect', payload);
    await fsp.writeFile(SESSION_FILE, encrypted, 'utf8');
  } catch (e) {
    console.error('[hoyolab] save failed', e.message);
  }
}

function decodeAuthkey(value) {
  const text = String(value || '');
  try { return decodeURIComponent(text); } catch { return text; }
}

async function fetchProfile(session) {
  const uid = session.cookies.get('ltuid_v2')?.value
    || session.cookies.get('account_id_v2')?.value
    || session.cookies.get('account_id')?.value
    || '';
  if (!uid) return null;
  const url = `https://bbs-api-os.hoyolab.com/user/wapi/getUserFullInfo?gids=2&uid=${encodeURIComponent(uid)}`;
  try {
    const res = await fetch(url, {
      headers: { Cookie: cookieHeader(session.cookies), 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));
    const info = data?.data?.user_info || {};
    if (!info || data?.retcode !== 0) return null;
    return {
      nickname: info.nickname || info.nick_name || '',
      avatar: info.avatar_url || info.avatar || '',
      aid: uid,
    };
  } catch {
    return null;
  }
}

export async function restoreHoyolabSession() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    const encrypted = await fsp.readFile(SESSION_FILE, 'utf8');
    const payload = JSON.parse(await dpapi('unprotect', encrypted));
    const cookies = normalizeCookies(payload.cookies || []);
    if (!hasLoginCookie(cookies)) return null;
    const session = makeSession(cookies, payload.user || null);
    session.createdAt = payload.createdAt || Date.now();
    sessions.set(session.id, session);
    return sessionInfo(session);
  } catch (e) {
    console.error('[hoyolab] restore failed', e.message);
    return null;
  }
}

export async function importHoyolabSession(cookiesInput) {
  const cookies = normalizeCookies(cookiesInput);
  if (!hasLoginCookie(cookies)) {
    throw new Error('没有拿到 cookie_token_v2，请确认 HoYoLAB 已完成登录');
  }
  const session = makeSession(cookies);
  sessions.set(session.id, session);
  await persistSession(session);
  // Nickname is nice-to-have; never block the login window on the community API.
  fetchProfile(session).then((profile) => {
    if (!profile || sessions.get(SESSION_ID) !== session) return;
    session.user = { ...session.user, ...profile };
    persistSession(session).catch(() => {});
  }).catch(() => {});
  return sessionInfo(session);
}

function requireSession() {
  const session = sessions.get(SESSION_ID);
  if (!session) throw new Error('请先登录 HoYoLAB');
  if (!session.cookies?.size) throw new Error('HoYoLAB 登录态为空，请重新登录');
  return session;
}

async function fetchRegionRoles(session, game, region) {
  const url = `${ACCOUNT_BASE}/account/binding/api/getUserGameRolesOfRegionByCookieToken?region=${encodeURIComponent(region)}&game_biz=${encodeURIComponent(game.gameBiz.os)}`;
  const res = await fetch(url, {
    headers: { Cookie: cookieHeader(session.cookies), 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (data.retcode !== 0) {
    if ([-100, -101, 10001].includes(Number(data.retcode))) {
      const err = new Error('HoYoLAB 登录态已失效，请重新登录');
      err.code = 'AUTH_EXPIRED';
      throw err;
    }
    return [];
  }
  const list = data?.data?.list || data?.data?.game_roles || [];
  return list.map((role) => ({
    uid: String(role.game_uid || role.uid || ''),
    region: role.region || region,
    nickname: role.nickname || '',
    level: role.level || 0,
    gameBiz: role.game_biz || game.gameBiz.os,
    regionName: role.region_name || region,
    isOfficial: Boolean(role.is_official),
  })).filter((role) => role.uid);
}

export async function getHoyolabRoles(gameId) {
  const session = requireSession();
  const game = getGame(gameId);
  const out = [];
  const seen = new Set();
  let authError = null;
  for (const region of OS_REGIONS[gameId] || []) {
    try {
      for (const role of await fetchRegionRoles(session, game, region)) {
        const key = `${role.uid}|${role.region}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(role);
      }
    } catch (e) {
      if (e.code === 'AUTH_EXPIRED') authError = e;
    }
  }
  if (!out.length && authError) throw authError;
  return out;
}

export async function getAllHoyolabRoles() {
  const result = { roles: {}, errors: {} };
  for (const game of ['genshin', 'hsr', 'zzz']) {
    try {
      result.roles[game] = await getHoyolabRoles(game);
    } catch (e) {
      result.roles[game] = [];
      result.errors[game] = e.message;
    }
  }
  return result;
}

export async function generateHoyolabAuthkey(gameId, role) {
  const session = requireSession();
  const game = getGame(gameId);
  const body = {
    game_biz: role?.gameBiz || game.gameBiz.os,
    game_uid: String(role?.uid || ''),
    region: role?.region || '',
    auth_appid: 'webview_gacha',
  };
  if (!body.game_uid || !body.region) throw new Error('缺少游戏 UID / 区服');

  const res = await fetch(`${ACCOUNT_BASE}/binding/api/genAuthKeyByCookieToken`, {
    method: 'POST',
    headers: {
      Cookie: cookieHeader(session.cookies),
      'User-Agent': UA,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: 'https://www.hoyolab.com',
      Referer: 'https://www.hoyolab.com/',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (data.retcode !== 0 || !data.data?.authkey) {
    const message = String(data.message || '');
    if ([-100, -101].includes(Number(data.retcode)) || /login|登录|expired/i.test(message)) {
      const err = new Error('HoYoLAB 登录态未被接受，请重新登录后再试');
      err.code = 'AUTH_EXPIRED';
      throw err;
    }
    const err = new Error(`HoYoLAB 没有签发抽卡链接：${message || data.retcode}`);
    err.code = 'GEN_AUTHKEY_FAILED';
    throw err;
  }
  return {
    authkey: decodeAuthkey(data.data.authkey),
    signType: data.data.sign_type || 2,
    authkeyVer: data.data.authkey_ver || 1,
    role: body,
  };
}

export function getHoyolabSessionInfo() {
  const session = sessions.get(SESSION_ID);
  return session ? sessionInfo(session) : null;
}

export function logoutHoyolab() {
  sessions.delete(SESSION_ID);
  try { fs.unlinkSync(SESSION_FILE); } catch { /* already gone */ }
  return true;
}
