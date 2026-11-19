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
