const { app, BrowserWindow, Menu, dialog, shell, clipboard, ipcMain, nativeImage, ClipboardItem } = require('electron');
const { setupUpdater } = require('./updater.cjs');
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const portableDataRoot = app.isPackaged
  ? path.join(path.dirname(process.execPath), 'data')
  : path.join(app.getAppPath(), 'data');
const legacyUserData = app.getPath('userData');
fs.mkdirSync(path.join(portableDataRoot, 'electron'), { recursive: true });
app.commandLine.appendSwitch('user-data-dir', path.join(portableDataRoot, 'electron'));
app.setPath('userData', path.join(portableDataRoot, 'electron'));
app.setPath('sessionData', path.join(portableDataRoot, 'electron'));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let serverUrl = null;
let heyboxWindow = null;
let nteCapturePath = null;
let heyboxCapture = [];
let heyboxCaptureBytes = 0;
const heyboxSeen = new Set();

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

async function prepareDataDir() {
  const target = portableDataRoot;
  await fsp.mkdir(path.join(target, 'uploads'), { recursive: true });
  await fsp.mkdir(path.join(target, 'assets'), { recursive: true });
  const bundled = path.join(app.getAppPath(), 'data');
  for (const name of ['catalog-genshin.json', 'catalog-hsr.json', 'catalog-zzz.json', 'catalog-hi3.json', 'catalog-tot.json', 'versions-zzz.json', 'versions-hsr.json', 'versions-genshin.json', 'versions-hi3.json', 'versions-tot.json', 'up-pools.json']) {
    const dest = path.join(target, name);
    if (!fs.existsSync(dest) && fs.existsSync(path.join(bundled, name))) {
      await fsp.copyFile(path.join(bundled, name), dest);
    }
  }
  // one-time migration from the old AppData location, never delete source
  const old = path.join(legacyUserData, 'data');
  const oldApp = path.join(old, 'app.json');
  const newApp = path.join(target, 'app.json');
  if (!fs.existsSync(newApp) && fs.existsSync(oldApp)) {
    await fsp.copyFile(oldApp, newApp);
    if (fs.existsSync(path.join(old, 'backups'))) {
      await fsp.cp(path.join(old, 'backups'), path.join(target, 'backups'), { recursive: true }).catch(() => {});
    }
  }
  process.env.GACHA_DATA_DIR = target;
}

ipcMain.handle('share:copy-image', async (_event, dataUrl) => {
  const image = nativeImage.createFromDataURL(String(dataUrl || ''));
  if (image.isEmpty()) throw new Error('图片生成失败');
  if (typeof clipboard.write === 'function' && typeof ClipboardItem === 'function') {
    const blob = new Blob([image.toPNG()], { type: 'image/png' });
    await clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } else if (typeof clipboard.writeImage === 'function') {
    clipboard.writeImage(image);
  } else {
    throw new Error('当前系统不支持写入图片剪贴板');
  }
  return { ok: true };
});

ipcMain.handle('share:save-image', async (_event, dataUrl, name) => {
  const safeName = String(name || '二游档案-分享.jpg').replace(/[\\/:*?"<>|]/g, '-');
  const options = { defaultPath: path.join(app.getPath('pictures'), safeName), filters: [{ name: 'JPEG', extensions: ['jpg', 'jpeg'] }] };
  const result = mainWindow ? await dialog.showSaveDialog(mainWindow, options) : await dialog.showSaveDialog(options);
  if (result.canceled || !result.filePath) return { canceled: true };
  const base64 = String(dataUrl || '').replace(/^data:image\/jpeg;base64,/, '');
  await fsp.writeFile(result.filePath, Buffer.from(base64, 'base64'));
  return { ok: true, path: result.filePath };
});

async function waitForServer(url) {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(800) });
      if (r.ok) return true;
    } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

async function startBackend() {
  const port = await freePort();
  process.env.PORT = String(port);
  process.env.HOST = '127.0.0.1';
  serverUrl = `http://127.0.0.1:${port}`;
  const serverEntry = pathToFileURL(path.join(app.getAppPath(), 'src', 'server.js')).href;
  await import(serverEntry);
  const ready = await waitForServer(serverUrl);
  if (!ready) throw new Error('本地数据服务启动超时');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1080,
    minHeight: 700,
    show: false,
    backgroundColor: '#0b0e14',
    title: '二游档案',
    icon: path.join(app.getAppPath(), 'public', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  Menu.setApplicationMenu(null);
  mainWindow.loadURL(serverUrl);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('context-menu', (_event, params) => {
    if (params.mediaType !== 'image') return;
    const menu = Menu.buildFromTemplate([{
      label: '复制图片',
      click: () => mainWindow.webContents.copyImageAt(params.x, params.y),
    }]);
    menu.popup({ window: mainWindow });
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url) && !url.startsWith(serverUrl)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(serverUrl)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    if (code === -3) return;
    dialog.showErrorBox('二游档案启动失败', `窗口加载失败（${code} ${desc}）。\n请重新启动应用。`);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function resetHeyboxCapture() {
  heyboxCapture = [];
  heyboxCaptureBytes = 0;
  heyboxSeen.clear();
}

function cleanupHeyboxWindow() {
  try {
    if (heyboxWindow && !heyboxWindow.isDestroyed() && heyboxWindow.webContents.debugger.isAttached()) {
      heyboxWindow.webContents.debugger.detach();
    }
  } catch {}
  try {
    if (heyboxWindow && !heyboxWindow.isDestroyed()) {
      heyboxWindow.webContents.session.clearStorageData().catch(() => {});
    }
  } catch {}
  heyboxWindow = null;
  resetHeyboxCapture();
}

async function openHeyboxWindow() {
  if (heyboxWindow && !heyboxWindow.isDestroyed()) {
    heyboxWindow.show();
    heyboxWindow.focus();
    return { ok: true, reused: true };
  }
  resetHeyboxCapture();
  const partition = `heybox-import-${Date.now()}`;
  heyboxWindow = new BrowserWindow({
    width: 1120,
    height: 840,
    minWidth: 860,
    minHeight: 620,
    parent: mainWindow || undefined,
    backgroundColor: '#0b0e14',
    title: '小黑盒导入（实验）',
    autoHideMenuBar: true,
    webPreferences: {
      partition,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  heyboxWindow.setMenuBarVisibility(false);
  heyboxWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) return { action: 'allow' };
    return { action: 'deny' };
  });
  heyboxWindow.on('closed', () => cleanupHeyboxWindow());
  try {
    const dbg = heyboxWindow.webContents.debugger;
    dbg.attach('1.3');
    dbg.on('message', async (_event, method, params) => {
      if (method !== 'Network.responseReceived' || !params?.response) return;
      const url = String(params.response.url || '');
      if (!/(^|\.)xiaoheihe\.cn|(^|\.)heybox/i.test(url)) return;
      if (!/json/i.test(String(params.response.mimeType || ''))) return;
      if (/login|auth|token|captcha|sms|passport|oauth/i.test(url)) return;
      try {
        const result = await dbg.sendCommand('Network.getResponseBody', { requestId: params.requestId });
        const body = result.base64Encoded ? Buffer.from(result.body, 'base64').toString('utf8') : String(result.body || '');
        if (!body || body.length > 3 * 1024 * 1024 || heyboxCaptureBytes + body.length > 12 * 1024 * 1024) return;
        const digest = crypto.createHash('sha1').update(body).digest('hex');
        if (heyboxSeen.has(digest)) return;
        heyboxSeen.add(digest);
        heyboxCapture.push({ url, body });
        heyboxCaptureBytes += body.length;
      } catch { /* response body may be evicted */ }
    });
    await dbg.sendCommand('Network.enable');
  } catch (e) {
    heyboxWindow.webContents.once('did-finish-load', () => {
      dialog.showErrorBox('小黑盒导入', `无法监听页面数据：${e.message}`);
    });
  }
  heyboxWindow.loadURL('https://www.xiaoheihe.cn/').catch(() => {});
  return { ok: true };
}

ipcMain.handle('heybox:open', async () => openHeyboxWindow());
ipcMain.handle('heybox:collect', async () => ({
  responses: heyboxCapture.map((item) => ({ url: item.url, body: item.body })),
  count: heyboxCapture.length,
  bytes: heyboxCaptureBytes,
}));
ipcMain.handle('heybox:close', async () => {
  if (heyboxWindow && !heyboxWindow.isDestroyed()) heyboxWindow.close();
  return { ok: true };
});

const HOYOLAB_COOKIE_NAMES = new Set([
  'cookie_token_v2', 'cookie_token', 'account_id_v2', 'account_id', 'account_mid_v2',
  'ltoken_v2', 'ltoken', 'ltuid_v2', 'ltuid', 'ltmid_v2', 'stoken_v2', 'stoken',
]);

// Official HoYoverse passport login form, loaded standalone. `ux_mode=redirect`
// makes it navigate back to `st` (the account centre) after login, where the
// passport exchange sets the cookies this window polls for.
const HOYOLAB_LOGIN_URL = 'https://account.hoyoverse.com/login-platform/index.html'
  + '?st=https%3A%2F%2Faccount.hoyoverse.com%2F%23%2Flogin'
  + '&token_type=4&client_type=4&app_id=de8ohyzxreo0&game_biz=plat_os'
  + '&lang=zh-cn&theme=light-default&hide_logo=0&ux_mode=redirect&iframe_level=0'
  + '#/password-login';
// Fallback: account-centre landing page, where we auto-open the login iframe.
const HOYOLAB_FALLBACK_URL = 'https://account.hoyoverse.com/#/login';

let hoyolabWindow = null;
let hoyolabLogin = null;

function openHoyolabLoginWindow() {
  if (hoyolabLogin) return hoyolabLogin.promise;

  let resolvePromise;
  const promise = new Promise((resolve) => { resolvePromise = resolve; });
  const partition = `hoyolab-login-${Date.now()}`;
  const win = new BrowserWindow({
    width: 480,
    height: 700,
    minWidth: 420,
    minHeight: 600,
    center: true,
    maximizable: false,
    fullscreenable: false,
    parent: mainWindow || undefined,
    backgroundColor: '#ffffff',
    title: 'HoYoLAB 登录',
    autoHideMenuBar: true,
    webPreferences: {
      partition,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.setMenuBarVisibility(false);
  const hoyolabSession = win.webContents.session;
  win.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36');
  win.webContents.setWindowOpenHandler(({ url }) => (/^https?:/i.test(url) ? { action: 'allow' } : { action: 'deny' }));

  const state = { win, settled: false, timer: null, timeout: null, promise, resolve: resolvePromise, tokenSeenAt: 0, fallbackUsed: false };
  hoyolabWindow = win;
  hoyolabLogin = state;

  const finish = async (result) => {
    if (state.settled) return;
    state.settled = true;
    if (state.timer) clearInterval(state.timer);
    if (state.timeout) clearTimeout(state.timeout);
    try {
      if (!win.isDestroyed()) await hoyolabSession.clearStorageData();
    } catch { /* ignore */ }
    try {
      if (!win.isDestroyed()) win.close();
    } catch { /* ignore */ }
    if (hoyolabWindow === win) hoyolabWindow = null;
    if (hoyolabLogin === state) hoyolabLogin = null;
    state.resolve(result);
  };

  win.on('closed', () => {
    if (state.settled) return;
    state.settled = true;
    if (state.timer) clearInterval(state.timer);
    if (state.timeout) clearTimeout(state.timeout);
    hoyolabSession.clearStorageData().catch(() => {});
    if (hoyolabWindow === win) hoyolabWindow = null;
    if (hoyolabLogin === state) hoyolabLogin = null;
    state.resolve({ ok: false, message: '已关闭 HoYoLAB 登录窗口' });
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _url, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    if (!state.fallbackUsed) {
      state.fallbackUsed = true;
      win.loadURL(HOYOLAB_FALLBACK_URL).catch(() => {});
      return;
    }
    finish({ ok: false, message: `HoYoLAB 登录页加载失败：${errorDescription}` });
  });

  win.webContents.on('did-finish-load', () => {
    if (state.settled || state.tokenSeenAt || !state.fallbackUsed) return;
    const url = win.webContents.getURL();
    if (url.includes('/login-platform/')) return;
    // Account centre: click its Log In button, then turn the embedded passport
    // iframe into a full-window login form (hide the marketing page around it).
    win.webContents.executeJavaScript(`(() => {
      let clicked = false;
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        const frame = [...document.querySelectorAll('iframe')].find((f) => /login-platform/.test(f.src || ''));
        if (frame) {
          clearInterval(timer);
          if (document.getElementById('hyv-login-minimal')) return;
          const style = document.createElement('style');
          style.id = 'hyv-login-minimal';
          let css = 'body{background:#f5f7fb!important;margin:0!important;overflow:hidden!important}'
            + '#hyv-account-frame{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;border:0!important;z-index:2147483647!important;background:#f5f7fb!important}';
          const app = document.getElementById('app');
          if (app && !app.contains(frame)) css += '#app{display:none!important}';
          style.textContent = css;
          document.head.appendChild(style);
          return;
        }
        if (!clicked) {
          const hit = [...document.querySelectorAll('button, a')].find((el) => {
            const text = (el.textContent || '').trim();
            return /^log\s*in(\s|$)/i.test(text) || text.startsWith('登录');
          });
          if (hit) { hit.click(); clicked = true; }
        }
        if (tries > 600) clearInterval(timer);
      }, 400);
    })();`).catch(() => {});
  });

  state.timer = setInterval(async () => {
    if (state.settled || win.isDestroyed()) return;
    try {
      const cookies = await win.webContents.session.cookies.get({});
      const hasToken = cookies.some((c) => c.name === 'cookie_token_v2')
        || (cookies.some((c) => c.name === 'cookie_token') && cookies.some((c) => c.name === 'account_id'));
      if (!hasToken) {
        state.tokenSeenAt = 0;
        return;
      }
      // Give the passport flow a moment to land companion cookies (account_mid_v2 etc.).
      if (!state.tokenSeenAt) {
        state.tokenSeenAt = Date.now();
        return;
      }
      if (Date.now() - state.tokenSeenAt < 2000) return;
      const payload = cookies
        .filter((c) => HOYOLAB_COOKIE_NAMES.has(c.name))
        .map((c) => ({ name: c.name, value: c.value, domain: c.domain }));
      const res = await fetch(`${serverUrl}/api/auth/hoyolab/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        await finish({ ok: false, message: data.message || 'HoYoLAB 登录态导入失败' });
        return;
      }
      await finish({ ok: true, session: data.session });
    } catch { /* keep polling */ }
  }, 1500);

  state.timeout = setTimeout(() => {
    finish({ ok: false, message: 'HoYoLAB 登录超时，请重试' });
  }, 10 * 60 * 1000);
  if (state.timeout.unref) state.timeout.unref();

  win.loadURL(HOYOLAB_LOGIN_URL).catch(() => {});
  return promise;
}

ipcMain.handle('hoyolab:login', async () => openHoyolabLoginWindow());

function nteCaptureDir() {
  return path.join(portableDataRoot, 'nte-captures');
}

ipcMain.handle('nte:capture-start', async (_event, options = {}) => {
  const mode = options?.mode === 'auto' ? 'auto' : 'manual';
  const cli = path.join(app.getAppPath(), 'tools', 'nte-gacha-exporter', 'nte-gacha-exporter-cli.exe');
  if (!fs.existsSync(cli)) throw new Error('内置抓取组件缺失，请重新安装完整包');
  const dir = nteCaptureDir();
  await fsp.mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.join(dir, `nte-${mode}-${stamp}.json`);
  nteCapturePath = out;
  const args = ['capture', '--json', out, '--locale', 'zh-CN'];
  if (mode === 'auto') args.push('--auto-page');
  const child = spawn(cli, args, {
    cwd: path.dirname(cli),
    detached: true,
    windowsHide: false,
    stdio: 'ignore',
  });
  child.on('error', () => {});
  child.unref();
  return { ok: true, path: out, mode };
});

ipcMain.handle('nte:capture-status', async (_event, file) => {
  const target = path.resolve(String(file || ''));
  const dir = path.resolve(nteCaptureDir());
  if (!target.startsWith(`${dir}${path.sep}`)) throw new Error('无效的抓取路径');
  if (!fs.existsSync(target)) return { exists: false, size: 0 };
  const stat = await fsp.stat(target);
  return { exists: true, size: stat.size, mtime: stat.mtimeMs };
});

ipcMain.handle('nte:capture-read', async (_event, file) => {
  const target = path.resolve(String(file || ''));
  const dir = path.resolve(nteCaptureDir());
  if (!target.startsWith(`${dir}${path.sep}`)) throw new Error('无效的抓取路径');
  const stat = await fsp.stat(target);
  if (stat.size > 64 * 1024 * 1024) throw new Error('抓取文件过大');
  return fsp.readFile(target, 'utf8');
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    await prepareDataDir();
    await startBackend();
    createWindow();
    setupUpdater(() => mainWindow);
  } catch (e) {
    dialog.showErrorBox('二游档案无法启动', String(e?.stack || e?.message || e));
    app.quit();
  }
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (!mainWindow && serverUrl) createWindow(); });
process.on('uncaughtException', (e) => {
  try { dialog.showErrorBox('二游档案错误', String(e?.stack || e)); } catch {}
});
