const { app, dialog, ipcMain } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const OWNER = 'ichiryu0021';
const REPO = 'miyou-archive';
const API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const UA = 'MiyouArchive-Updater';
let latestAsset = null;
let latestVersion = '';

function compareVersion(a, b) {
  const pa = String(a || '0').replace(/^v/i, '').split('.').map((x) => Number(x) || 0);
  const pb = String(b || '0').replace(/^v/i, '').split('.').map((x) => Number(x) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

async function checkUpdates() {
  const current = app.getVersion();
  const res = await fetch(API, { headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  const latest = String(data.tag_name || data.name || '').replace(/^v/i, '');
  const asset = (data.assets || []).find((a) => /\.zip$/i.test(a.name) && /clean|干净|miyou/i.test(a.name))
    || (data.assets || []).find((a) => /\.zip$/i.test(a.name));
  if (!asset) throw new Error('release 没有 zip 资源');
  latestAsset = asset.browser_download_url;
  latestVersion = latest;
  return {
    current,
    latest,
    hasUpdate: compareVersion(latest, current) > 0,
    name: data.name || data.tag_name || '',
    notes: data.body || '',
    publishedAt: data.published_at || '',
    asset: asset.name,
  };
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`下载失败 ${res.status}`);
  await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function findAppRoot(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  if (entries.some((e) => e.isDirectory() && e.name === 'resources') && entries.some((e) => e.isFile() && e.name.endsWith('.exe'))) {
    return path.join(dir, 'resources', 'app');
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = await findAppRoot(path.join(dir, entry.name)).catch(() => null);
    if (found) return found;
  }
  return null;
}

async function applyUpdate() {
  if (!latestAsset) throw new Error('请先检查更新');
  const work = await fsp.mkdtemp(path.join(os.tmpdir(), 'miyou-update-'));
  const zip = path.join(work, 'update.zip');
  try {
    await download(latestAsset, zip);
    const extract = path.join(work, 'extract');
    await fsp.mkdir(extract, { recursive: true });
    await execFileAsync('tar.exe', ['-xf', zip, '-C', extract], { windowsHide: true, timeout: 120000 });
    const sourceApp = await findAppRoot(extract);
    if (!sourceApp) throw new Error('更新包结构不正确');
    const targetApp = app.getAppPath();
    const backupDir = path.join(path.dirname(process.execPath), 'data', 'backups');
    await fsp.mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fsp.cp(targetApp, path.join(backupDir, `app-before-${stamp}`), { recursive: true }).catch(() => {});
    await fsp.cp(sourceApp, targetApp, { recursive: true, force: true });
    return { ok: true, version: latestVersion };
  } finally {
    await fsp.rm(work, { recursive: true, force: true }).catch(() => {});
  }
}

function setupUpdater(getWindow) {
  ipcMain.handle('update:check', async () => checkUpdates());
  ipcMain.handle('update:apply', async () => {
    const result = await applyUpdate();
    getWindow()?.webContents.send('update:status', { stage: 'restart', ...result });
    setTimeout(() => { app.relaunch(); app.exit(0); }, 800);
    return result;
  });
  ipcMain.handle('update:version', () => app.getVersion());
  setTimeout(async () => {
    try {
      const info = await checkUpdates();
      if (!info.hasUpdate) return;
      const dialogOptions = {
        type: 'info',
        title: '发现新版本',
        message: `米游档案 ${info.latest}`,
        detail: '是否下载并更新？更新后会自动重启。',
        buttons: ['更新', '稍后'],
        defaultId: 0,
        cancelId: 1,
      };
      const choice = getWindow() ? await dialog.showMessageBox(getWindow(), dialogOptions) : await dialog.showMessageBox(dialogOptions);
      if (choice.response === 0) {
        getWindow()?.webContents.send('update:status', { stage: 'downloading', version: info.latest });
        await applyUpdate();
        app.relaunch();
        app.exit(0);
      }
    } catch { /* offline / no release */ }
  }, 8000).unref?.();
}

module.exports = { setupUpdater, checkUpdates };
