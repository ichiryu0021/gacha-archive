#!/usr/bin/env node
/**
 * 二游档案 · 动态主题独立入口
 * 扫描 themes/ 下的 theme.json，动态提供主题清单、CSS/JS 和状态 API。
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const catalogModule = [
  path.resolve(__dirname, '..', '..', 'src', 'api', 'theme-catalog.js'),
  path.resolve(ROOT, 'resources', 'app', 'src', 'api', 'theme-catalog.js'),
  path.resolve(__dirname, '..', 'runtime', 'theme-catalog.mjs'),
].find((file) => fs.existsSync(file));
if (!catalogModule) throw new Error('找不到主题目录模块 theme-catalog.js');
const { readThemeCatalog, resolveThemeFile } = await import(pathToFileURL(catalogModule).href);
const THEME_DIR = path.resolve(__dirname, '..');
const BASE_CSS = path.join(THEME_DIR, 'mecha', 'theme.css');
const LOADER_JS = path.join(THEME_DIR, 'runtime', 'theme-loader.js');
const STATE_FILE = path.join(__dirname, '.theme-state.json');
const HOST = '127.0.0.1';
const THEME_PORT = Number(process.env.THEME_PORT || 8791);
const DEMO = process.argv.includes('--demo') || process.env.THEME_DEMO === '1';
const backendArgIndex = process.argv.indexOf('--backend');
const BACKEND_URL = backendArgIndex >= 0 ? process.argv[backendArgIndex + 1] : (process.env.THEME_BACKEND || '');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
};

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, HOST, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function catalog() {
  return readThemeCatalog(THEME_DIR);
}

function themeById(id) {
  return catalog().themes.find((theme) => theme.id === id) || null;
}

function normalizeGames(raw, cat = catalog()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const valid = new Set(cat.themes.map((theme) => theme.id));
  return Object.fromEntries(Object.entries(raw).filter(([game, theme]) => /^[a-z][a-z0-9-]*$/.test(game) && valid.has(theme)));
}

function readState() {
  const cat = catalog();
  let raw = {};
  try { raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) || {}; } catch { raw = {}; }
  const theme = cat.themes.some((item) => item.id === raw.theme) ? raw.theme : cat.defaultTheme;
  return { theme, gameThemes: normalizeGames(raw.gameThemes, cat) };
}

async function writeState(state) {
  const payload = JSON.stringify({
    theme: state.theme,
    gameThemes: state.gameThemes || {},
    updatedAt: new Date().toISOString(),
  }, null, 2);
  await fsp.mkdir(__dirname, { recursive: true });
  const temp = `${STATE_FILE}.${process.pid}.tmp`;
  await fsp.writeFile(temp, payload, 'utf8');
  await fsp.rename(temp, STATE_FILE);
  return state;
}

function themeAttrs(themeId, cat = catalog()) {
  const theme = cat.themes.find((item) => item.id === themeId) || cat.themes.find((item) => item.id === cat.defaultTheme) || cat.themes[0];
  if (!theme) return { theme: 'mecha', variant: 'dark' };
  if (theme.mode === 'variant') {
    const base = cat.themes.find((item) => item.id === theme.extends);
    return { theme: base?.id || theme.extends || theme.id, variant: theme.variant || 'light' };
  }
  if (theme.mode === 'builtin') return { theme: theme.id, variant: '' };
  if (theme.id === cat.baseTheme) return { theme: theme.id, variant: theme.variant === 'light' ? 'light' : 'dark' };
  return { theme: theme.id, variant: '' };
}

function readBody(req, limit = 16384) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, data) {
  const body = Buffer.from(JSON.stringify(data));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function serveFile(req, res, file) {
  try {
    if (!file) throw new Error('not found');
    const stat = await fsp.stat(file);
    if (!stat.isFile()) throw new Error('not a file');
    const ext = path.extname(file).toLowerCase();
    const body = await fsp.readFile(file);
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'content-length': String(body.length),
      'cache-control': 'no-store',
    });
    if (req.method === 'HEAD') return res.end();
    return res.end(body);
  } catch {
    return json(res, 404, { ok: false, message: '主题资源不存在' });
  }
}

function htmlInjection(html, state) {
  const attrs = themeAttrs(state.theme);
  let output = html.replace(/<html(\s[^>]*)?>/i, (_match, existing = '') => {
    const cleaned = String(existing)
      .replace(/\sdata-(?:theme|mecha-variant)="[^"]*"/gi, '')
      .replace(/\sdata-mecha-theme="[^"]*"/gi, '');
    const variant = attrs.variant ? ` data-mecha-variant="${attrs.variant}"` : '';
    return `<html${cleaned} data-theme="${attrs.theme}"${variant} data-mecha-theme="1">`;
  });
  const payload = JSON.stringify(attrs);
  const head = [
    `<script>(function(){var d=${payload};var h=document.documentElement;h.dataset.theme=d.theme;if(d.variant)h.dataset.mechaVariant=d.variant;h.dataset.mechaTheme='1';})();</script>`,
    '<link rel="stylesheet" href="/__theme/base.css">',
  ].join('');
  const tail = '<script src="/__theme/theme.js"></script>';
  if (!/<\/head>/i.test(output) || !/<\/body>/i.test(output)) return html;
  output = output.replace(/<\/head>/i, `${head}</head>`);
  output = output.replace(/<\/body>/i, `${tail}</body>`);
  return output;
}

async function handleThemeApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/__theme/api/state') {
    const cat = catalog();
    const state = readState();
    return json(res, 200, {
      ok: true,
      theme: state.theme,
      gameThemes: state.gameThemes,
      defaultTheme: cat.defaultTheme,
      baseTheme: cat.baseTheme,
      themes: cat.themes,
    });
  }
  if (req.method === 'POST' && pathname === '/__theme/api/theme') {
    try {
      const cat = catalog();
      const body = JSON.parse(await readBody(req));
      const theme = cat.themes.some((item) => item.id === body.theme) ? body.theme : null;
      if (!theme) return json(res, 400, { ok: false, message: '未知主题' });
      const gameThemes = normalizeGames(body.gameThemes, cat);
      const state = await writeState({ theme, gameThemes });
      return json(res, 200, { ok: true, ...state });
    } catch (error) {
      return json(res, 400, { ok: false, message: error.message || '请求无效' });
    }
  }
  return json(res, 404, { ok: false, message: '主题接口不存在' });
}

async function serveThemeRoute(req, res, pathname) {
  if (pathname === '/__theme/themes.json') return json(res, 200, catalog());
  if (pathname === '/__theme/base.css') return serveFile(req, res, BASE_CSS);
  if (pathname === '/__theme/theme.css') return serveFile(req, res, BASE_CSS);
  if (pathname === '/__theme/theme.js') return serveFile(req, res, LOADER_JS);
  if (pathname.startsWith('/__theme/files/')) {
    const parts = pathname.slice('/__theme/files/'.length).split('/');
    const id = decodeURIComponent(parts.shift() || '');
    const relative = parts.map((part) => decodeURIComponent(part)).join('/');
    return serveFile(req, res, resolveThemeFile(THEME_DIR, id, relative));
  }
  return json(res, 404, { ok: false, message: '主题资源不存在' });
}

function proxy(req, res) {
  const headers = {
    ...req.headers,
    host: `${backendHost}:${backendPort}`,
    'accept-encoding': 'identity',
  };
  const upstream = http.request({ host: backendHost, port: backendPort, path: req.url, method: req.method, headers }, (up) => {
    const contentType = String(up.headers['content-type'] || '');
    if (contentType.includes('text/html')) {
      const chunks = [];
      let size = 0;
      up.on('data', (chunk) => {
        size += chunk.length;
        if (size > 4 * 1024 * 1024) {
          up.destroy(new Error('HTML 页面过大'));
          return;
        }
        chunks.push(chunk);
      });
      up.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf8');
        const injected = Buffer.from(htmlInjection(html, readState()), 'utf8');
        const outHeaders = { ...up.headers };
        delete outHeaders['content-encoding'];
        delete outHeaders['transfer-encoding'];
        delete outHeaders['content-length'];
        outHeaders['content-type'] = 'text/html; charset=utf-8';
        outHeaders['content-length'] = String(injected.length);
        outHeaders['cache-control'] = 'no-store';
        res.writeHead(up.statusCode || 200, outHeaders);
        res.end(req.method === 'HEAD' ? undefined : injected);
      });
      up.on('error', (e) => {
        if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`主题入口读取页面失败：${e.message}`);
      });
      return;
    }
    res.writeHead(up.statusCode || 502, up.headers);
    up.pipe(res);
  });
  upstream.on('error', (e) => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`主题入口无法连接原服务：${e.message}`);
  });
  req.pipe(upstream);
}

async function waitForBackend(port, host = HOST) {
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch(`http://${host}:${port}/api/health`, { signal: AbortSignal.timeout(800) });
      if (response.ok) return true;
    } catch {
      /* starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return false;
}

let backendHost = HOST;
let backendPort;
let backendMode = '内置';
if (BACKEND_URL) {
  const parsed = new URL(BACKEND_URL);
  backendHost = parsed.hostname;
  backendPort = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
  backendMode = '复用';
  if (!(await waitForBackend(backendPort, backendHost))) {
    console.error(`\n无法连接已有数据服务：${BACKEND_URL}`);
    process.exit(1);
  }
} else {
  backendPort = await freePort();
  process.env.PORT = String(backendPort);
  process.env.HOST = HOST;
  if (!process.env.GACHA_DATA_DIR) {
    process.env.GACHA_DATA_DIR = path.join(ROOT, DEMO ? 'demo-data' : 'data');
  }
  const backendFile = [
    path.join(ROOT, 'src', 'server.js'),
    path.join(ROOT, 'resources', 'app', 'src', 'server.js'),
  ].find((file) => fs.existsSync(file));
  if (!backendFile) throw new Error('找不到原数据服务 src/server.js');
  const backendEntry = pathToFileURL(backendFile).href;
  await import(backendEntry);
  if (!(await waitForBackend(backendPort))) {
    console.error('\n原版数据服务启动超时，主题入口退出。');
    process.exit(1);
  }
}

const proxyServer = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${THEME_PORT}`);
  if (url.pathname.startsWith('/__theme/api/')) {
    handleThemeApi(req, res, url.pathname).catch((e) => json(res, 500, { ok: false, message: e.message }));
    return;
  }
  if (url.pathname.startsWith('/__theme/')) {
    serveThemeRoute(req, res, url.pathname).catch((e) => json(res, 500, { ok: false, message: e.message }));
    return;
  }
  proxy(req, res);
});

proxyServer.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n主题入口端口 ${THEME_PORT} 已被占用。可用 THEME_PORT=8792 指定其他端口。\n`);
  } else {
    console.error('[theme]', e);
  }
  process.exit(1);
});

proxyServer.listen(THEME_PORT, HOST, () => {
  console.log('\n  ── 二游档案 · 机能主题入口 ─────────────────────');
  console.log(`  主题入口：http://${HOST}:${THEME_PORT}`);
  console.log(`  数据服务：${backendMode} ${backendHost}:${backendPort}${backendMode === '内置' ? `（${process.env.GACHA_DATA_DIR}）` : ''}`);
  const currentTheme = themeById(readState().theme);
  console.log(`  当前主题：${currentTheme?.name || 'mecha'}（${currentTheme?.en || 'MECHANICAL'}）`);
  console.log(`  主题目录：${THEME_DIR}`);
  console.log('  原项目文件零改动；Ctrl+C 退出。');
  console.log('  ───────────────────────────────────────────────\n');
});

async function shutdown() {
  proxyServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1200).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
