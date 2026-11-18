import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_VERSION, ASSET_DIR, BUNDLED_DATA_DIR, DATA_DIR, GAMES, GAME_IDS, HOST, PORT, PUBLIC_DIR, ROOT, UPLOAD_DIR,
  getGame, isAllowedAssetHost,
} from './config.js';
import { Store } from './store.js';
import { hash, sleep, uid } from './utils.js';
import { analyzeGame, filterRecords } from './api/analyze.js';
import { autoCheckCatalogs, catalogPublic, loadCatalog, syncCatalog } from './api/catalog.js';
import {
  fetchAllRecords, getRememberedSource, parseGachaLink, pendingSummary, rememberSource,
  sourceFromAuthkey, summarizePullTotals,
} from './api/gacha.js';
import { scanLocalLinks } from './api/cache.js';
import { createQrSession, fetchZzzOfficialStats, generateAuthkey, getAllRoles, getRolesForGame, getSavedSessionInfo, logoutSession, pollQrSession, restoreMiyousheSession } from './api/auth.js';
import { buildCsv, buildUigf, importUigf, snapshotFromZzz } from './api/uigf.js';
import { parseScreenshot, saveReviewedRecords } from './api/ocr.js';
import { Collector } from './api/collector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await fsp.mkdir(DATA_DIR, { recursive: true });
await fsp.mkdir(UPLOAD_DIR, { recursive: true });
await fsp.mkdir(ASSET_DIR, { recursive: true });
for (const name of ['catalog-genshin.json', 'catalog-hsr.json', 'catalog-zzz.json', 'catalog-hi3.json', 'catalog-tot.json', 'versions-zzz.json', 'versions-hsr.json']) {
  const target = path.join(DATA_DIR, name);
  const source = path.join(BUNDLED_DATA_DIR, name);
  if (!fs.existsSync(target) && fs.existsSync(source)) await fsp.copyFile(source, target);
}
if (!fs.existsSync(path.join(DATA_DIR, 'app.json')) && fs.existsSync(path.join(BUNDLED_DATA_DIR, 'app.json'))) {
  await fsp.copyFile(path.join(BUNDLED_DATA_DIR, 'app.json'), path.join(DATA_DIR, 'app.json'));
}
const store = await new Store().init();
await restoreMiyousheSession();

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
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'Content-Length': st.size,
    });
    fs.createReadStream(file).pipe(res);
  } catch {
    fail(res, 'Not found', 404);
  }
}

async function proxyAsset(req, res, url) {
  const target = url.searchParams.get('u');
  if (!target) return fail(res, '缺少图片地址', 400);
  let parsed;
  try { parsed = new URL(target); } catch { return fail(res, '图片地址无效', 400); }
  if (!/^https?:$/.test(parsed.protocol) || !isAllowedAssetHost(parsed.hostname)) return fail(res, '不允许的图片域名', 403);
  const ext = path.extname(parsed.pathname).slice(0, 6) || '.bin';
  const key = hash(target, 24) + ext;
  const file = path.join(ASSET_DIR, key);
  if (fs.existsSync(file)) {
    const st = await fsp.stat(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=604800', 'Content-Length': st.size });
    return fs.createReadStream(file).pipe(res);
  }
  try {
    const r = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 GachaArchive/0.9', Referer: 'https://www.mihoyo.com/' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return fail(res, `图片源返回 ${r.status}`, 502);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 12 * 1024 * 1024) return fail(res, '图片过大', 502);
    await fsp.writeFile(file, buf);
    res.writeHead(200, { 'Content-Type': r.headers.get('content-type') || MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=604800', 'Content-Length': buf.length });
    res.end(buf);
  } catch (e) {
    fail(res, `图片加载失败：${e.message}`, 502);
  }
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

async function routeApi(req, res, url) {
  const pathname = url.pathname;
  if (req.method === 'GET' && pathname === '/api/health') return ok(res, { version: APP_VERSION, time: new Date().toISOString() });
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
  if (req.method === 'POST' && pathname === '/api/records/manual') {
    const body = await readJsonBody(req);
    const game = sanitizeGame(body.game);
    const name = String(body.name || '').trim();
    const time = String(body.time || '').replace('T', ' ').slice(0, 19);
    if (!name) throw new Error('缺少名称');
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(time)) throw new Error('时间格式不正确');
    const gachaType = String(body.gachaType || '1');
    const g = getGame(game);
    const rec = {
      id: '', uid: '', gachaType, uigfType: g.uigfMap[gachaType] || gachaType,
      itemId: '', count: 1, time: time.length === 16 ? time + ':00' : time,
      name, itemType: '', rank: 5, lang: 'zh-cn',
      poolName: g.pools[gachaType] || '手动', source: 'manual', synthetic: true,
      pity: Number(body.pity) || null,
    };
    const result = store.mergeRecords(game, [rec], { source: 'manual' });
    await store.flush(true);
    return ok(res, { result });
  }
  if (req.method === 'POST' && pathname === '/api/links/scan') {
    const result = await scanLocalLinks();
    return ok(res, result);
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
          return ok(res, { ...result, fromCache: true });
        }
      }
    } catch { /* fallback to generated authkey */ }
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
    const raw = await fetchZzzOfficialStats(sessionId);
    const snapshot = store.addSnapshot('zzz', snapshotFromZzz(raw));
    await store.flush(true);
    return ok(res, {
      snapshot: {
        id: snapshot.id, totalPulls: snapshot.totalPulls, fiveStars: snapshot.fiveStars,
        perType: snapshot.perType, periodEnd: snapshot.periodEnd,
      },
      dashboard: summaryResponse('zzz'),
    });
  }
  fail(res, '接口不存在', 404);
}

let collector;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname.startsWith('/api/asset')) return proxyAsset(req, res, url);
    if (url.pathname.startsWith('/api/')) return await routeApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (e) {
    console.error('[api]', e.message);
    const status = e.code === 'AUTH_EXPIRED' ? 401 : 400;
    fail(res, e.message || '服务器错误', status, { code: e.code || '' });
  }
});

collector = new Collector({ store, syncFn: resync });
await collector.start();
setTimeout(() => { autoCheckCatalogs().catch(() => {}); }, 6000).unref?.();

server.listen(PORT, HOST, () => {
  console.log(`\n  米游档案 · Gacha Archive v${APP_VERSION}`);
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
