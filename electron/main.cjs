const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const { setupUpdater } = require('./updater.cjs');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');
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
  for (const name of ['catalog-genshin.json', 'catalog-hsr.json', 'catalog-zzz.json', 'catalog-hi3.json', 'catalog-tot.json', 'versions-zzz.json', 'versions-hsr.json']) {
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
    title: '米游档案',
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
    dialog.showErrorBox('米游档案启动失败', `窗口加载失败（${code} ${desc}）。\n请重新启动应用。`);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

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
    dialog.showErrorBox('米游档案无法启动', String(e?.stack || e?.message || e));
    app.quit();
  }
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (!mainWindow && serverUrl) createWindow(); });
process.on('uncaughtException', (e) => {
  try { dialog.showErrorBox('米游档案错误', String(e?.stack || e)); } catch {}
});
