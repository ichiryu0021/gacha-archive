import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_VERSION, APP_DISPLAY_VERSION, ASSET_DIR, BUNDLED_DATA_DIR, DATA_DIR, GAMES, GAME_IDS, HOST, PORT, PUBLIC_DIR, ROOT, UPLOAD_DIR,
  getGame, isAllowedAssetHost,
} from './config.js';
import { Store } from './store.js';
import { hash, sleep, uid } from './utils.js';
import { readThemeCatalog, resolveThemeFile, resolveThemeRoot } from './api/theme-catalog.js';
import { analyzeGame, filterRecords } from './api/analyze.js';
import { autoCheckCatalogs, catalogPublic, loadCatalog, syncCatalog } from './api/catalog.js';
import {
  fetchAllRecords, getRememberedSource, parseGachaLink, pendingSummary, rememberSource,
  sourceFromAuthkey, summarizePullTotals,
} from './api/gacha.js';
import { scanLocalLinks } from './api/cache.js';
import { createQrSession, fetchZzzFullHistory, generateAuthkey, getAllRoles, getRolesForGame, getSavedSessionInfo, logoutSession, pollQrSession, restoreMiyousheSession } from './api/auth.js';
import {
  generateHoyolabAuthkey, getAllHoyolabRoles, getHoyolabRoles, getHoyolabSessionInfo,
  importHoyolabSession, logoutHoyolab, restoreHoyolabSession,
} from './api/hoyolab.js';
import { buildCsv, buildUigf, importUigf } from './api/uigf.js';
import { HEYBOX_GAMES, buildHeybox, importHeybox } from './api/heybox.js';
import { importHeyboxLive } from './api/heybox-live.js';
import { importNteExport, repairNteAccount } from './api/nte-export.js';
import { bannersAsOf, bannersFor, currentBanners } from './api/banners.js';
import { parseScreenshot, saveReviewedRecords } from './api/ocr.js';
import { Collector } from './api/collector.js';
import { importNteuid } from './api/nteuid.js';
import {
  createHypergryphQr, findEndfieldLogUrls, hypergryphLogout, hypergryphRefreshBindings,
  loginTajiduo, parseEndfieldUrl, pollHypergryphQr, restoreThirdPartySessions,
  sendTajiduoCaptcha, syncArknights, syncEndfield, syncEndfieldFromUrl, syncNte,
  tajiduoLogout, thirdPartyStatus,
} from './api/thirdparty.js';
import * as XLSX from 'xlsx';


const THEME_ROOT = resolveThemeRoot(ROOT);

const MANUAL_HEADERS = ['名称', '卡池', '版本', '抽数', '时间'];
const MANUAL_DEFAULT_POOL = { genshin: '301', hsr: '11', zzz: '2', hi3: '1', tot: '1' };

function manualCell(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function manualPool(game, value) {
  const text = String(value || '').trim();
  if (!text) return MANUAL_DEFAULT_POOL[game.id] || game.types[0];
  for (const [type, label] of Object.entries(game.pools || {})) {
    if (text === type || text === label) return type;
  }
  return MANUAL_DEFAULT_POOL[game.id] || game.types[0];
}

function manualTime(value) {
  if (!value) return '';
  let text = String(value).trim().replace(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/, (_, y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  text = text.replace('T', ' ').slice(0, 19);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += ' 00:00:00';
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(text)) text += ':00';
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) throw new Error(`时间格式不正确：${text}`);
  return text;
}

function manualRecord(game, row, order = 0) {
  const g = getGame(game);
  const name = manualCell(row, ['名称', '角色', 'name', 'Name']);
  if (!name) return null;
  const gachaType = manualPool(g, manualCell(row, ['卡池', 'pool', 'gacha_type', 'gachaType']));
  const version = manualCell(row, ['版本', 'version']);
  const pityText = manualCell(row, ['抽数', 'pity']);
  const pity = Number(pityText);
  const time = manualTime(manualCell(row, ['时间', 'time']));
  return {
    id: '', uid: '', gachaType, uigfType: g.uigfMap[gachaType] || gachaType,
    itemId: '', count: 1, time, name, itemType: '', rank: 5, lang: 'zh-cn',
    poolName: g.pools[gachaType] || '手动', source: 'manual', synthetic: true,
    pity: Number.isFinite(pity) && pity > 0 ? pity : null,
    version: version || undefined,
    order,
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await fsp.mkdir(DATA_DIR, { recursive: true });
await fsp.mkdir(UPLOAD_DIR, { recursive: true });
await fsp.mkdir(ASSET_DIR, { recursive: true });
for (const name of ['catalog-genshin.json', 'catalog-hsr.json', 'catalog-zzz.json', 'catalog-hi3.json', 'catalog-tot.json', 'versions-zzz.json', 'versions-hsr.json', 'versions-genshin.json', 'versions-hi3.json', 'versions-tot.json', 'up-pools.json']) {
  const target = path.join(DATA_DIR, name);
  const source = path.join(BUNDLED_DATA_DIR, name);
  if (!fs.existsSync(target) && fs.existsSync(source)) await fsp.copyFile(source, target);
}
if (!fs.existsSync(path.join(DATA_DIR, 'app.json')) && fs.existsSync(path.join(BUNDLED_DATA_DIR, 'app.json'))) {
  await fsp.copyFile(path.join(BUNDLED_DATA_DIR, 'app.json'), path.join(DATA_DIR, 'app.json'));
}
const store = await new Store().init();
const nteRepair = repairNteAccount(store);
if (nteRepair.changed) await store.flush(true);
await restoreMiyousheSession();
await restoreHoyolabSession();
await restoreThirdPartySessions().catch((e) => console.error('[thirdparty] restore failed', e.message));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(buf);
}
function ok(res, data) { send(res, 200, { ok: true, ...data }); }
function fail(res, message, status = 400, extra = {}) { send(res, status, { ok: false, message, ...extra }); }

async function readJsonBody(req, limit = 24 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('请求内容过大');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(text); } catch { throw new Error('请求 JSON 格式不正确'); }
}

function sanitizeGame(value) {
  const game = String(value || '').replace(/[^a-z0-9]/g, '');
  if (!GAME_IDS.includes(game)) throw new Error('请选择正确的游戏');
  return game;
}

function summaryResponse(game) {
  const account = store.account(game);
  const analysis = analyzeGame({ gameId: game, account, catalog: loadCatalog(game) });
  return analysis;
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const roots = [
    { prefix: '/uploads/', dir: UPLOAD_DIR },
    { prefix: '/assets/', dir: ASSET_DIR },
    { prefix: '/', dir: PUBLIC_DIR },
  ];
  const root = roots.find((r) => pathname.startsWith(r.prefix));
  if (!root) return fail(res, 'Not found', 404);
  const rel = pathname.slice(root.prefix.length);
  const file = path.resolve(root.dir, rel);
  if (!file.startsWith(path.resolve(root.dir))) return fail(res, 'Forbidden', 403);
  try {
    const st = await fsp.stat(file);
    if (!st.isFile()) return fail(res, 'Not found', 404);
    const ext = path.extname(file).toLowerCase();
    // 界面文件每次都要最新的：本地服务，缓存省不了什么，
    // 反而会让 `?v=` 没跟着改的 styles.css / app.js 一直吃旧副本。
    const fresh = ext === '.html' || ext === '.css' || ext === '.js' || ext === '.json';
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': fresh ? 'no-store' : 'public, max-age=3600',
      'Content-Length': st.size,
    });
    fs.createReadStream(file).pipe(res);
  } catch {
    fail(res, 'Not found', 404);
  }
}

let assetActive = 0;
const assetWaiters = [];
async function withAssetSlot(fn) {
  if (assetActive >= 4) await new Promise((resolve) => assetWaiters.push(resolve));
  assetActive += 1;
  try {
    return await fn();
  } finally {
    assetActive -= 1;
    const next = assetWaiters.shift();
    if (next) next();
  }
}

function assetPlaceholder(target, buf) {
  try {
    const host = new URL(target).hostname.toLowerCase();
    return /(^|\.)upload-bbs\.mihoyo\.com$/.test(host) && buf.length === 55633;
  } catch {
    return false;
  }
}

async function proxyAsset(req, res, url) {
  const target = url.searchParams.get('u');
  if (!target) return fail(res, '缺少图片地址', 400);
  let parsed;
  try { parsed = new URL(target); } catch { return fail(res, '图片地址无效', 400); }
  if (!/^https?:$/.test(parsed.protocol) || !isAllowedAssetHost(parsed.hostname)) return fail(res, '不允许的图片域名', 403);
  const fallback = url.searchParams.get('fallback') || '';
  let fallbackUrl = null;
  if (fallback) {
    try {
      const parsedFallback = new URL(fallback);
      if (/^https?:$/.test(parsedFallback.protocol) && isAllowedAssetHost(parsedFallback.hostname)) fallbackUrl = fallback;
    } catch { /* ignore invalid fallback */ }
  }
  const ext = path.extname(parsed.pathname).slice(0, 6) || '.bin';
  const key = hash(target, 24) + ext;
  const file = path.join(ASSET_DIR, key);
  if (fs.existsSync(file)) {
    const st = await fsp.stat(file);
    if (st.size > 1024 && st.size !== 55633) {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=604800', 'Content-Length': st.size });
      return fs.createReadStream(file).pipe(res);
    }
  }
  const candidates = [target, fallbackUrl].filter(Boolean);
  return withAssetSlot(async () => {
    let lastError = '';
    for (const candidate of candidates) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await fetch(candidate, { headers: { 'User-Agent': 'Mozilla/5.0 GachaArchive/0.9', Referer: 'https://www.mihoyo.com/' }, signal: AbortSignal.timeout(20000) });
          if (!r.ok) { lastError = `图片源返回 ${r.status}`; continue; }
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length > 12 * 1024 * 1024) { lastError = '图片过大'; continue; }
          if (!buf.length || assetPlaceholder(candidate, buf)) { lastError = '图片源返回占位图'; continue; }
          await fsp.writeFile(file, buf);
          res.writeHead(200, { 'Content-Type': r.headers.get('content-type') || MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=604800', 'Content-Length': buf.length });
          return res.end(buf);
        } catch (e) {
          lastError = e.message;
        }
        await sleep(180);
      }
    }
    return fail(res, `图片加载失败：${lastError || '无可用图片源'}`, 502);
  });
}

function annotateFivePity(gameId, records) {
  const game = getGame(gameId);
  const counters = new Map();
  const sorted = [...records].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')) || String(a.id).localeCompare(String(b.id)));
  for (const r of sorted) {
    const key = r.uigfType || game.uigfMap[r.gachaType] || r.gachaType;
    const n = (counters.get(key) || 0) + 1;
    if (Number(r.rank) === 5) {
      r.pity = n;
      counters.set(key, 0);
    } else counters.set(key, n);
  }
  return sorted;
}

async function resync(source, options = {}) {
  const data = await fetchAllRecords(source, options);
  const totals = summarizePullTotals(source.game, data.records);
  const sorted = annotateFivePity(source.game, data.records);
  const five = sorted.filter((r) => Number(r.rank) === 5);
  const merged = store.mergeRecords(source.game, five, {
    source: 'official',
    meta: { ...data.meta, gameBiz: source.gameBiz, lang: source.lang, isOversea: source.isOversea },
    lastSource: 'official',
  });
  store.setTotals(source.game, totals);
  await store.flush(true);
  return {
    game: source.game,
    gameName: getGame(source.game).name,
    addedFive: merged.added,
    upgradedFive: merged.upgraded || 0,
    totalFetched: data.records.length,
    fiveStars: five.length,
    typeResults: data.typeResults,
    errors: data.errors,
    meta: data.meta,
    totals,
  };
}

function applyThirdPartySync(result) {
  const game = result.game;
  const meta = {
    uid: result.uid || result.binding?.uid || '',
    nickname: result.nickname || result.binding?.nickname || '',
    region: result.binding?.channelName || result.role?.serverName || '',
    gameBiz: GAMES[game]?.gameBiz?.cn || '',
    lang: 'zh-cn',
    timezone: 8,
  };
  const incoming = result.records || [];
  if (!incoming.length && !Number(result.totals?.exact)) {
    throw new Error('没有读取到记录；已保留本地旧数据，请确认账号和接口窗口');
  }
  const merged = store.mergeRecords(game, incoming, {
    source: 'official',
    meta,
    lastSource: 'official',
  });
  const hasDaily = result.totals?.daily && Object.keys(result.totals.daily).length > 0;
  if (hasDaily) {
    store.setTotals(game, result.totals);
  } else {
    const prev = store.account(game)?.totals || {};
    const perType = { ...(prev.perType || {}) };
    for (const [type, value] of Object.entries(result.totals?.perType || {})) {
      perType[type] = {
        total: Math.max(Number(prev.perType?.[type]?.total) || 0, Number(value?.total) || 0),
        five: Math.max(Number(prev.perType?.[type]?.five) || 0, Number(value?.five) || 0),
      };
    }
    store.setWindowTotals(game, {
      ...result.totals,
      exact: Math.max(Number(prev.exact) || 0, Number(result.totals?.exact) || 0),
      perType,
    });
  }
  if (result.poolNames) store.setPoolNames(game, result.poolNames);
  return {
    game,
    gameName: getGame(game).name,
    addedFive: merged.added,
    upgradedFive: merged.upgraded || 0,
    totalFetched: result.totalFetched || result.totals?.exact || 0,
    fiveStars: (result.records || []).length,
    dashboard: summaryResponse(game),
    totals: result.totals,
  };
}

async function syncZzzMiyoushe() {
  const saved = getSavedSessionInfo();
  if (!saved) throw new Error('米游社未登录');
  const full = await fetchZzzFullHistory(saved.sessionId);
  const merged = store.mergeRecords('zzz', full.records, {
    source: 'official-full',
    meta: { uid: full.role.uid, region: full.role.region, gameBiz: 'nap_cn', lang: 'zh-cn' },
    lastSource: 'zzz-official',
  });
  store.setFullTotals('zzz', full.totals);
  await store.flush(true);
  return {
    totalFetched: full.totals.exact,
    addedFive: merged.added,
    upgradedFive: merged.upgraded || 0,
    fiveStars: full.records.length,
  };
}

async function routeApi(req, res, url) {
  const pathname = url.pathname;
  if (req.method !== 'GET' && !pathname.startsWith('/api/asset')) {
    const contentType = String(req.headers['content-type'] || '');
    if (!contentType.includes('application/json')) {
      return fail(res, '请求必须使用 application/json', 415);
    }
    const origin = String(req.headers.origin || '');
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.host) return fail(res, '请求来源不匹配', 403);
      } catch {
        return fail(res, '请求来源不匹配', 403);
      }
    }
  }
  if (req.method === 'GET' && pathname === '/api/health') return ok(res, { version: APP_VERSION, time: new Date().toISOString() });
  if (req.method === 'GET' && pathname === '/api/thirdparty/status') {
    return ok(res, { thirdparty: await thirdPartyStatus() });
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/skland/qr') {
    return ok(res, await createHypergryphQr());
  }
  if (req.method === 'GET' && pathname.startsWith('/api/thirdparty/skland/qr/')) {
    const id = decodeURIComponent(pathname.split('/').pop());
    return ok(res, { session: await pollHypergryphQr(id) });
  }
  if (req.method === 'GET' && pathname === '/api/thirdparty/skland/bindings') {
    const bindings = await hypergryphRefreshBindings();
    return ok(res, { bindings });
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/skland/logout') {
    return ok(res, { result: await hypergryphLogout() });
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/sync') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    let result;
    if (game === 'arknights') result = await syncArknights();
    else if (game === 'endfield') result = await syncEndfield();
    else if (game === 'nte') result = await syncNte();
    else throw new Error('这个游戏暂不支持第三方接口同步');
    const synced = applyThirdPartySync(result);
    await store.flush(true);
    return ok(res, synced);
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/endfield/scan') {
    const found = findEndfieldLogUrls();
    const links = found.urls.map((url) => {
      try {
        const parsed = parseEndfieldUrl(url);
        return { provider: parsed.provider, serverId: parsed.serverId, preview: `u8_token=${parsed.token.slice(0, 4)}***${parsed.token.slice(-3)}` };
      } catch {
        return { provider: '', serverId: '', preview: '无效链接' };
      }
    });
    return ok(res, { links, diagnostics: found.diagnostics });
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/endfield/parse') {
    const body = await readJsonBody(req);
    const parsed = parseEndfieldUrl(body.url);
    return ok(res, { link: { provider: parsed.provider, serverId: parsed.serverId, preview: `u8_token=${parsed.token.slice(0, 4)}***${parsed.token.slice(-3)}` } });
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/endfield/sync') {
    const body = await readJsonBody(req);
    let url = String(body.url || '').trim();
    if (!url && body.useLog) {
      const found = findEndfieldLogUrls();
      url = found.urls[found.urls.length - 1] || '';
      if (!url) throw new Error('本机日志里还没有抽卡链接，请先在游戏内打开一次寻访记录');
    }
    if (!url) throw new Error('缺少终末地抽卡链接');
    const result = await syncEndfieldFromUrl(url);
    const synced = applyThirdPartySync(result);
    await store.flush(true);
    return ok(res, synced);
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/tajiduo/captcha') {
    const body = await readJsonBody(req);
    const result = await sendTajiduoCaptcha(body.phone, body.deviceId);
    return ok(res, result);
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/tajiduo/login') {
    const body = await readJsonBody(req);
    const result = await loginTajiduo(body.phone, body.code, body.deviceId);
    return ok(res, { user: result });
  }
  if (req.method === 'POST' && pathname === '/api/thirdparty/tajiduo/logout') {
    return ok(res, { result: await tajiduoLogout() });
  }
  if (req.method === 'GET' && pathname === '/api/collector') {
    return ok(res, { collector: collector.status(), settings: store.state.settings });
  }
  if (req.method === 'POST' && pathname === '/api/settings/visibility') {
    const body = await readJsonBody(req);
    const hidden = store.setHiddenGames(body.hidden);
    await store.flush(true);
    return ok(res, { hiddenGames: hidden });
  }
  if (req.method === 'POST' && pathname === '/api/settings/order') {
    const body = await readJsonBody(req);
    const order = store.setGameOrder(body.order);
    await store.flush(true);
    return ok(res, { gameOrder: order });
  }
  if (req.method === 'POST' && pathname === '/api/collector') {
    const body = await readJsonBody(req);
    if (typeof body.enabled !== 'boolean') throw new Error('缺少 enabled');
    const status = await collector.setEnabled(body.enabled);
    return ok(res, { collector: status });
  }
  if (req.method === 'GET' && pathname === '/api/state') {
    return ok(res, {
      version: APP_VERSION,
      displayVersion: APP_DISPLAY_VERSION,
      dataDir: DATA_DIR,
      gameOrder: store.state.settings?.gameOrder || GAME_IDS,
      hiddenGames: store.state.settings?.hiddenGames || [],
      summary: store.summary(),
      games: Object.fromEntries(GAME_IDS.map((g) => [g, { name: GAMES[g].name, officialWindow: GAMES[g].officialWindow }])),
      catalog: Object.fromEntries(GAME_IDS.map((g) => { const c = loadCatalog(g); return [g, { version: c.version, updatedAt: c.updatedAt, count: c.items.length }]; })),
    });
  }
  if (req.method === 'GET' && pathname === '/api/dashboard') {
    const game = sanitizeGame(url.searchParams.get('game'));
    return ok(res, { dashboard: summaryResponse(game) });
  }
  if (req.method === 'GET' && pathname === '/api/catalog') {
    const game = sanitizeGame(url.searchParams.get('game'));
    return ok(res, { catalog: catalogPublic(game) });
  }
  if (req.method === 'POST' && pathname === '/api/catalog/sync') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    const result = await syncCatalog(game);
    return ok(res, { result });
  }
  if (req.method === 'GET' && pathname === '/api/records') {
    const game = sanitizeGame(url.searchParams.get('game'));
    const analysis = summaryResponse(game);
    const filtered = filterRecords(analysis, {
      pool: url.searchParams.get('pool') || 'all',
      rarity: url.searchParams.get('rarity') || 'all',
      source: url.searchParams.get('source') || 'all',
      search: url.searchParams.get('search') || '',
      from: url.searchParams.get('from') || '',
      to: url.searchParams.get('to') || '',
    });
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Math.min(500, Math.max(10, Number(url.searchParams.get('pageSize')) || 30));
    const start = (page - 1) * pageSize;
    return ok(res, {
      total: filtered.length, page, pageSize, records: filtered.slice(start, start + pageSize),
      pools: analysis.pools, generatedAt: analysis.generatedAt,
    });
  }
  if (req.method === 'GET' && pathname === '/api/manual/template') {
    const game = sanitizeGame(url.searchParams.get('game'));
    const g = getGame(game);
    const first = MANUAL_DEFAULT_POOL[game] || g.types[0];
    const ws = XLSX.utils.aoa_to_sheet([MANUAL_HEADERS]);
    ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '手动记录');
    const help = XLSX.utils.aoa_to_sheet([
      ['填写说明'],
      ['第一行填写最新记录，向下按从新到旧顺序填写。'],
      ['卡池填写卡池名称；版本和时间可以留空。'],
      ['结果（UP/歪）由软件自动判断，不需要填写。'],
      ['请勿修改表头，不需要的行请整行删除。'],
    ]);
    help['!cols'] = [{ wch: 64 }];
    XLSX.utils.book_append_sheet(wb, help, '说明');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="miyou-manual-template.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
    return;
  }
  if (req.method === 'POST' && pathname === '/api/manual/import') {
    const body = await readJsonBody(req, 30 * 1024 * 1024);
    const game = sanitizeGame(body.game);
    const base64 = String(body.data || '').replace(/^data:.*?base64,/, '');
    if (!base64) throw new Error('没有收到表格文件');
    let workbook;
    try { workbook = XLSX.read(Buffer.from(base64, 'base64'), { type: 'buffer', cellDates: true }); }
    catch { throw new Error('无法读取这个表格，请使用导出的模板'); }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    const records = [];
    const errors = [];
    for (const [index, row] of rows.entries()) {
      try {
        const rec = manualRecord(game, row, index);
        if (rec) records.push(rec);
      } catch (e) {
        errors.push(`第 ${index + 2} 行：${e.message}`);
      }
    }
    if (!records.length) throw new Error(errors[0] || '表格里没有可导入的记录');
    const result = store.mergeRecords(game, records, { source: 'manual' });
    await store.flush(true);
    return ok(res, { result, count: records.length, skipped: rows.length - records.length, errors: errors.slice(0, 5) });
  }
  if (req.method === 'POST' && pathname === '/api/records/manual') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    const name = String(body.name || '').trim();
    const time = String(body.time || '').replace('T', ' ').slice(0, 19);
    if (!name) throw new Error('缺少名称');
    if (time && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(time)) throw new Error('时间格式不正确');
    const gachaType = String(body.gachaType || '1');
    const version = String(body.version || '').trim();
    const up = body.up === 'win' || body.up === 'loss' ? body.up : '';
    const g = getGame(game);
    const rec = {
      id: '', uid: '', gachaType, uigfType: g.uigfMap[gachaType] || gachaType,
      itemId: '', count: 1, time: time ? (time.length === 16 ? time + ':00' : time) : '',
      name, itemType: String(body.itemType || ''), rank: 5, lang: 'zh-cn',
      poolName: g.pools[gachaType] || '手动', source: 'manual', synthetic: true,
      pity: Number(body.pity) || null, version: version || undefined, up: up || undefined,
    };
    const result = store.mergeRecords(game, [rec], { source: 'manual' });
    await store.flush(true);
    return ok(res, { result });
  }
  if (req.method === 'POST' && pathname === '/api/links/scan') {
    const result = await scanLocalLinks();
    return ok(res, result);
  }
  if (req.method === 'GET' && pathname === '/api/links/url') {
    const linkId = new URL(req.url, 'http://127.0.0.1').searchParams.get('linkId') || '';
    const source = getRememberedSource(linkId);
    if (!source) throw new Error('链接已过期，请重新扫描');
    return ok(res, { url: source.rawUrl || source.displayUrl || '' });
  }
  if (req.method === 'POST' && pathname === '/api/links/parse') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    const source = parseGachaLink(body.url);
    if (source.game !== game) throw new Error(`这个链接属于${GAMES[source.game].name}，不是${GAMES[game].name}`);
    source.source = 'manual';
    const linkId = rememberSource(source);
    source.linkId = linkId;
    return ok(res, { link: pendingSummary(source) });
  }
  if (req.method === 'POST' && pathname === '/api/sync') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    let source = body.linkId ? getRememberedSource(body.linkId) : null;
    if (!source && body.url) {
      source = parseGachaLink(body.url);
      source.source = 'manual';
    }
    if (!source) throw new Error('链接已过期，请重新扫描或粘贴');
    if (source.game !== game) throw new Error('链接与当前游戏不匹配');
    const result = await resync(source);
    return ok(res, result);
  }
  if (req.method === 'POST' && pathname === '/api/import/heybox') {
    const body = await readJsonBody(req);
    if (body.game && body.game !== 'arknights') return fail(res, '小黑盒 JSON 导入目前只支持明日方舟', 400);
    const result = await importHeybox(store, body.data || body);
    return ok(res, result);
  }
  if (req.method === 'POST' && pathname === '/api/import/heybox-live') {
    const body = await readJsonBody(req, 48 * 1024 * 1024);
    const game = sanitizeGame(body.game);
    if (!Array.isArray(body.responses) || !body.responses.length) return fail(res, '没有捕获到小黑盒页面数据', 400);
    const result = await importHeyboxLive(store, game, body.responses);
    return ok(res, result);
  }
  if (req.method === 'POST' && pathname === '/api/import/nte-export') {
    const body = await readJsonBody(req, 48 * 1024 * 1024);
    const result = await importNteExport(store, body.data || body);
    return ok(res, result);
  }
  if (req.method === 'POST' && pathname === '/api/import/nteuid') {
    const body = await readJsonBody(req);
    const result = await importNteuid(store, body.data || body);
    await store.flush(true);
    return ok(res, { result, dashboard: summaryResponse('nte') });
  }
  if (req.method === 'POST' && pathname === '/api/import/uigf') {
    const body = await readJsonBody(req);
    const data = body.data || body;
    const result = await importUigf(store, data);
    return ok(res, result);
  }
  if (req.method === 'GET' && pathname === '/api/export/uigf') {
    const game = sanitizeGame(url.searchParams.get('game'));
    const account = store.account(game);
    const payload = buildUigf(game, account);
    const name = `UIGF-${game}-${account?.uid || 'local'}-${new Date().toISOString().slice(0, 10)}.json`;
    return send(res, 200, JSON.stringify(payload, null, 2), {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
    });
  }
  if (req.method === 'GET' && pathname === '/api/banners') {
    const game = sanitizeGame(url.searchParams.get('game'));
    return ok(res, { game, asOf: bannersAsOf(), current: currentBanners(game), all: bannersFor(game) });
  }
  if (req.method === 'GET' && pathname === '/api/export/heybox') {
    const game = sanitizeGame(url.searchParams.get('game'));
    if (!HEYBOX_GAMES.includes(game)) return fail(res, '小黑盒目前没有公开的该游戏导入格式', 400);
    const account = store.account(game);
    const payload = buildHeybox(game, account);
    const name = `小黑盒-${GAMES[game].name}-${account?.uid || 'local'}-${new Date().toISOString().slice(0, 10)}.json`;
    return send(res, 200, JSON.stringify(payload, null, 2), {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
    });
  }
  if (req.method === 'GET' && pathname === '/api/export/csv') {
    const game = sanitizeGame(url.searchParams.get('game'));
    const account = store.account(game);
    const csv = buildCsv(account);
    const name = `五星记录-${GAMES[game].name}-${new Date().toISOString().slice(0, 10)}.csv`;
    return send(res, 200, csv, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
    });
  }
  if (req.method === 'GET' && pathname === '/api/backup') {
    const json = JSON.stringify(store.exportAll(), null, 2);
    return send(res, 200, json, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="gacha-archive-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    });
  }
  if (req.method === 'POST' && pathname === '/api/snapshots') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    if (!(Number(body.totalPulls) > 0)) throw new Error('请填写有效的总抽数');
    const snapshot = store.addSnapshot(game, {
      source: body.source || 'manual',
      title: body.title || '历史汇总',
      periodStart: body.periodStart || GAMES[game].launchDate,
      periodEnd: body.periodEnd || new Date().toISOString().slice(0, 10),
      totalPulls: Number(body.totalPulls),
      fiveStars: Number(body.fiveStars) || 0,
      fourStars: 0,
      note: body.note || '',
      fullHistory: Boolean(body.fullHistory),
    });
    await store.flush(true);
    return ok(res, { snapshot });
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/snapshots/')) {
    const id = decodeURIComponent(pathname.split('/').pop());
    const game = sanitizeGame(url.searchParams.get('game'));
    const deleted = store.deleteSnapshot(game, id);
    await store.flush(true);
    return ok(res, { deleted });
  }
  if (req.method === 'POST' && pathname === '/api/reset') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    if (body.confirm !== 'RESET') throw new Error('缺少确认标记');
    store.resetGame(game);
    await store.flush(true);
    return ok(res, { reset: game });
  }
  if (req.method === 'POST' && pathname === '/api/ocr') {
    const body = await readJsonBody(req, 20 * 1024 * 1024);
    const game = sanitizeGame(body.game);
    const result = await parseScreenshot({ game, dataUrl: body.imageData });
    result.candidates = result.candidates.filter((c) => c.rank === 5);
    return ok(res, { result });
  }
  if (req.method === 'POST' && pathname === '/api/ocr/save') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    const result = await saveReviewedRecords(store, game, (body.records || []).filter((r) => Number(r.rank) === 5));
    await store.flush(true);
    return ok(res, { result });
  }
  if (req.method === 'GET' && pathname === '/api/auth/session') {
    const saved = getSavedSessionInfo();
    return ok(res, { session: saved });
  }
  if (req.method === 'POST' && pathname === '/api/auth/qr') {
    const qr = await createQrSession();
    return ok(res, qr);
  }
  if (req.method === 'GET' && pathname.startsWith('/api/auth/qr/')) {
    const id = decodeURIComponent(pathname.split('/').pop());
    const result = await pollQrSession(id);
    return ok(res, { session: result });
  }
  if (req.method === 'GET' && pathname === '/api/auth/roles-all') {
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) throw new Error('缺少登录会话');
    const result = await getAllRoles(sessionId);
    return ok(res, result);
  }
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const body = await readJsonBody(req);
    logoutSession(String(body.sessionId || ''));
    return ok(res, { loggedOut: true });
  }
  if (req.method === 'GET' && pathname === '/api/auth/roles') {
    const sessionId = url.searchParams.get('sessionId');
    const game = sanitizeGame(url.searchParams.get('game'));
    if (!sessionId) throw new Error('缺少登录会话');
    const roles = await getRolesForGame(sessionId, game);
    return ok(res, { roles });
  }
  if (req.method === 'POST' && pathname === '/api/auth/link') {
    const body = await readJsonBody(req);
    const sessionId = String(body.sessionId || '');
    const game = sanitizeGame(body.game);
    try {
      const scanned = await scanLocalLinks();
      const cached = scanned.found?.[game];
      if (cached?.linkId) {
        const cachedSource = getRememberedSource(cached.linkId);
        if (cachedSource) {
          const result = await resync(cachedSource);
          // A stale cache can return zero records with per-pool errors; in that case
          // fall through to a freshly generated authkey instead of reporting success.
          if (result.totalFetched > 0 || !result.errors?.length) {
            return ok(res, { ...result, fromCache: true });
          }
        }
      }
    } catch { /* fallback to generated authkey */ }
    if (game === 'hsr') {
      const err = new Error('星铁需要在游戏内打开「跃迁 → 记录」刷新 authkey；米游社登录不支持星铁抽卡记录');
      err.code = 'HSR_NEEDS_GAME_CACHE';
      throw err;
    }
    const key = await generateAuthkey(sessionId, game, body.role || {});
    const source = sourceFromAuthkey(game, key.authkey, {
      region: key.role.region, gameBiz: key.role.game_biz, lang: 'zh-cn', source: 'miyoushe',
    });
    source.linkId = rememberSource(source);
    const result = await resync(source);
    return ok(res, { ...result, authkeyMasked: `${key.authkey.slice(0, 4)}***${key.authkey.slice(-3)}` });
  }
  if (req.method === 'POST' && pathname === '/api/auth/zzz-stats') {
    const body = await readJsonBody(req);
    const sessionId = String(body.sessionId || '');
    const full = await fetchZzzFullHistory(sessionId, body.role || null);
    const merged = store.mergeRecords('zzz', full.records, {
      source: 'official-full',
      meta: { uid: full.role.uid, region: full.role.region, gameBiz: 'nap_cn', lang: 'zh-cn' },
      lastSource: 'zzz-official',
    });
    store.setFullTotals('zzz', full.totals);
    await store.flush(true);
    return ok(res, {
      addedFive: merged.added,
      upgradedFive: merged.upgraded || 0,
      totalFetched: full.totals.exact,
      fiveStars: full.records.length,
      snapshot: {
        totalPulls: full.totals.exact, fiveStars: full.records.length,
        perType: full.totals.perType, periodEnd: full.totals.end,
      },
      dashboard: summaryResponse('zzz'),
    });
  }
  if (req.method === 'GET' && pathname === '/api/auth/hoyolab/session') {
    return ok(res, { session: getHoyolabSessionInfo() });
  }
  if (req.method === 'POST' && pathname === '/api/auth/hoyolab/import') {
    const body = await readJsonBody(req);
    const session = await importHoyolabSession(body.cookies || []);
    return ok(res, { session });
  }
  if (req.method === 'GET' && pathname === '/api/auth/hoyolab/roles-all') {
    const result = await getAllHoyolabRoles();
    return ok(res, result);
  }
  if (req.method === 'GET' && pathname === '/api/auth/hoyolab/roles') {
    const game = sanitizeGame(url.searchParams.get('game'));
    const roles = await getHoyolabRoles(game);
    return ok(res, { roles });
  }
  if (req.method === 'POST' && pathname === '/api/auth/hoyolab/link') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    const key = await generateHoyolabAuthkey(game, body.role || {});
    const source = sourceFromAuthkey(game, key.authkey, {
      region: key.role.region,
      gameBiz: key.role.game_biz,
      lang: 'zh-cn',
      source: 'hoyolab',
      isOversea: true,
    });
    source.linkId = rememberSource(source);
    const result = await resync(source);
    return ok(res, { ...result, authkeyMasked: `${key.authkey.slice(0, 4)}***${key.authkey.slice(-3)}` });
  }
  if (req.method === 'POST' && pathname === '/api/auth/hoyolab/logout') {
    logoutHoyolab();
    return ok(res, { loggedOut: true });
  }
  fail(res, '接口不存在', 404);
}

let collector;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname === '/__theme/themes.json') {
      const catalog = readThemeCatalog(THEME_ROOT);
      const body = Buffer.from(JSON.stringify(catalog));
      res.writeHead(200, { 'Content-Type': MIME['.json'], 'Content-Length': String(body.length), 'Cache-Control': 'no-store' });
      return res.end(req.method === 'HEAD' ? undefined : body);
    }
    if (url.pathname.startsWith('/__theme/files/')) {
      const parts = url.pathname.slice('/__theme/files/'.length).split('/');
      const id = decodeURIComponent(parts.shift() || '');
      const relative = parts.map((part) => decodeURIComponent(part)).join('/');
      const file = resolveThemeFile(THEME_ROOT, id, relative);
      if (!file) return fail(res, '主题资源不存在', 404);
      const body = await fsp.readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': String(body.length),
        'Cache-Control': 'no-store',
      });
      return res.end(req.method === 'HEAD' ? undefined : body);
    }
    if (url.pathname.startsWith('/api/asset')) return proxyAsset(req, res, url);
    if (url.pathname.startsWith('/api/')) return await routeApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (e) {
    console.error('[api]', e.message);
    const status = e.code === 'AUTH_EXPIRED' ? 401 : 400;
    fail(res, e.message || '服务器错误', status, { code: e.code || '' });
  }
});

collector = new Collector({ store, syncFn: resync, zzzSyncFn: syncZzzMiyoushe });
await collector.start();
setTimeout(() => { autoCheckCatalogs().catch(() => {}); }, 6000).unref?.();

server.listen(PORT, HOST, () => {
  console.log(`\n  二游档案 · Gacha Archive v${APP_VERSION}`);
  console.log(`  http://${HOST}:${PORT}`);
  console.log(`  数据目录：${DATA_DIR}`);
  console.log('  仅绑定本机，抽卡凭据不会写入磁盘或发往第三方。\n');
});

async function shutdown() {
  console.log('\n正在保存数据…');
  collector?.stop();
  await store.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (e) => { console.error('[uncaught]', e); });
process.on('unhandledRejection', (e) => { console.error('[unhandled]', e); });
