const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { packager } = require('@electron/packager');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const finalDir = path.join(dist, '二游档案');
const stagingDir = path.join(dist, '.pack-staging');
const preserveDir = path.join(dist, `.data-preserve-${process.pid}`);

const ignoredRoots = new Set(['dist', 'docs', 'tests', 'themes']);
const ignoredData = new Set([
  'data/app.json',
  'data/app.json.bak',
]);
const ignoredDataDirs = new Set([
  'data/backups',
  'data/imports',
  'data/nte-captures',
  'data/uploads',
  'data/assets',
  'data/electron',
]);

function ignore(file) {
  const raw = String(file || '').replace(/\\/g, '/');
  const rel = raw.startsWith('/')
    ? raw.replace(/^\/+/, '')
    : path.relative(root, path.resolve(file)).replace(/\\/g, '/');
  if (!rel) return false;
  if (rel === '.git' || rel.startsWith('.git/')) return true;
  if (rel === 'BLACKBOARD.md' || rel === 'blackboard' || rel.startsWith('blackboard/')) return true;
  if (rel === 'CHANGELOG.md') return true;
  if (rel === 'demo-data' || rel.startsWith('demo-data/')) return true;
  if (rel === 'node_modules/.bin' || rel.startsWith('node_modules/.bin/')) return true;
  if (rel === 'node_modules/electron' || rel.startsWith('node_modules/electron/')) return true;
  if (rel === 'node_modules/@electron' || rel.startsWith('node_modules/@electron/')) return true;
  if (rel === 'scripts/pooltable.snippet.txt') return true;
  // 不把本机登录态、日志和开发数据打进程序目录。
  if (/^data\/[^/]+\.(dat|log)$/i.test(rel)) return true;
  if (/^data\/app\.json/i.test(rel)) return true;
  return ignoredRoots.has(rel.split('/')[0])
    || ignoredData.has(rel)
    || [...ignoredDataDirs].some((dir) => rel === dir || rel.startsWith(`${dir}/`));
}

async function exists(target) {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * 把独立主题包注入开发版的 public/：
 *   - 复制 theme.css / theme.js
 *   - 在 index.html 中注入首屏主题 Cookie 引导 + 样式 + 脚本
 * 不修改原项目 public/index.html。
 */
/**
 * 把源主题目录放进打包后的应用根目录，供用户直接查看/取用。
 * 状态文件（.theme-state.json）属于开发机，不进入发布目录。
 */
async function copyThemeFolder(stageApp) {
  const source = path.join(root, 'themes');
  if (!fs.existsSync(source)) return;
  const targets = [
    path.join(stageApp, 'themes'),
    path.join(stageApp, 'resources', 'app', 'themes'),
  ];
  for (const target of targets) {
    await fsp.cp(source, target, {
      recursive: true,
      filter: (src) => !/[\\/]\.theme-state\.json(\..*\.tmp)?$/.test(src),
    });
  }
  console.log('  主题目录：程序根目录 + resources/app 各一份（更新器兼容）');
}

async function injectTheme(stageApp) {
  const cssSource = path.join(root, 'themes', 'mecha', 'theme.css');
  const jsSource = path.join(root, 'themes', 'runtime', 'theme-loader.js');
  if (!fs.existsSync(cssSource) || !fs.existsSync(jsSource)) {
    console.warn('  主题：未找到 themes/mecha/theme.css 或 themes/runtime/theme-loader.js，开发版保持原版界面。');
    return false;
  }

  const publicDir = path.join(stageApp, 'resources', 'app', 'public');
  const cssTarget = path.join(publicDir, 'theme-base.css');
  const jsTarget = path.join(publicDir, 'theme-loader.js');
  await fsp.copyFile(cssSource, cssTarget);
  await fsp.copyFile(jsSource, jsTarget);

  const hash = crypto.createHash('sha256')
    .update(fs.readFileSync(cssSource))
    .update(fs.readFileSync(jsSource))
    .digest('hex')
    .slice(0, 10);

  const indexFile = path.join(publicDir, 'index.html');
  let html = await fsp.readFile(indexFile, 'utf8');
  if (html.includes('theme-loader.js')) {
    console.warn('  主题：index.html 已包含主题加载器，跳过。');
    return true;
  }
  if (!html.includes('</head>') || !html.includes('</body>')) {
    throw new Error('index.html 缺少 </head> 或 </body>，无法注入主题');
  }

  // 只写初始主题属性；具体主题清单和 CSS 由 theme-loader 动态读取。
  const boot = `<script>(function(){try{var m=document.cookie.match(/(?:^|;\\s*)ga_theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):'mecha';if(!/^[a-z][a-z0-9-]*$/.test(t))t='mecha';var h=document.documentElement;if(t==='classic'){h.dataset.theme='classic';delete h.dataset.mechaVariant;}else if(t==='light'){h.dataset.theme='mecha';h.dataset.mechaVariant='light';}else if(t==='mecha'){h.dataset.theme='mecha';h.dataset.mechaVariant='dark';}else{h.dataset.theme=t;}h.dataset.mechaEmbedded='1';}catch(e){var h=document.documentElement;h.dataset.theme='mecha';h.dataset.mechaVariant='dark';h.dataset.mechaEmbedded='1';}})();</script>`;
  const headInjection = `${boot}\n<link rel="stylesheet" href="/theme-base.css?h=${hash}">`;
  const bodyInjection = `<script src="/theme-loader.js?h=${hash}"></script>`;

  html = html.replace('</head>', `${headInjection}</head>`);
  html = html.replace('</body>', `${bodyInjection}</body>`);
  await fsp.writeFile(indexFile, html, 'utf8');
  console.log(`  主题：动态加载器已内置（基础样式 ${hash.slice(0, 8)}）`);
  return true;
}

function electronVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', 'electron', 'package.json'), 'utf8'));
  return pkg.version;
}

/**
 * Electron 二进制优先复用本机 @electron/get 缓存，避免每次构建都访问
 * GitHub 下载；在线失败时也能继续构建。找不到缓存时才让 packager 自行下载。
 */
function cachedElectronZip(version) {
  const zipName = `electron-v${version}-win32-x64.zip`;
  const roots = [
    process.env.ELECTRON_ZIP_DIR,
    path.join(process.env.LOCALAPPDATA || '', 'electron', 'Cache'),
    path.join(os.homedir(), '.cache', 'electron'),
    path.join(os.homedir(), 'AppData', 'Local', 'electron', 'Cache'),
  ].filter(Boolean);

  for (const cacheRoot of roots) {
    if (!fs.existsSync(cacheRoot)) continue;
    const direct = path.join(cacheRoot, zipName);
    if (fs.existsSync(direct)) return direct;
    let entries = [];
    try {
      entries = fs.readdirSync(cacheRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(cacheRoot, entry.name, zipName);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

async function main() {
  await fsp.mkdir(dist, { recursive: true });
  await fsp.rm(stagingDir, { recursive: true, force: true });
  await fsp.rm(preserveDir, { recursive: true, force: true });

  console.log('正在构建开发版…');
  console.log(`  源目录：${root}`);
  console.log(`  输出：  ${finalDir}`);

  const version = electronVersion();
  const localZip = cachedElectronZip(version);
  const electronOptions = { electronVersion: version };
  if (localZip) {
    electronOptions.electronZipDir = path.dirname(localZip);
    console.log(`  Electron：本地缓存 ${localZip}`);
  } else {
    console.log(`  Electron：v${version}（缓存未命中，将访问 GitHub 下载）`);
  }

  const [stageApp] = await packager({
    dir: root,
    name: '二游档案',
    platform: 'win32',
    arch: 'x64',
    out: stagingDir,
    overwrite: true,
    asar: false,
    icon: path.join(root, 'public', 'icon.ico'),
    prune: true,
    ignore,
    ...electronOptions,
  });

  await injectTheme(stageApp);
  await copyThemeFolder(stageApp);

  // 开发版目录里只有程序文件；data/ 是用户数据，单独保留。
  await fsp.rm(path.join(stageApp, 'data'), { recursive: true, force: true });

  const finalData = path.join(finalDir, 'data');
  const hadData = await exists(finalData);
  let movedData = false;

  try {
    if (hadData) {
      try {
        await fsp.rename(finalData, preserveDir);
        movedData = true;
      } catch (error) {
        throw new Error(
          `无法移开数据目录（${error.code || error.message}）。请先关闭正在运行的二游档案，再重新执行 npm.cmd run pack。`,
        );
      }
    }

    await fsp.rm(finalDir, { recursive: true, force: true });
    await fsp.rename(stageApp, finalDir);

    if (movedData) {
      await fsp.rename(preserveDir, finalData);
      movedData = false;
    }

    await fsp.rm(stagingDir, { recursive: true, force: true });
    console.log(`\n开发版已更新：${finalDir}`);
    console.log(hadData
      ? '用户数据已保留：dist\\二游档案\\data'
      : '未发现旧 data 目录，首次运行时会自动创建。');
    console.log('发布 zip 直接放 dist\\，不要再建 dist\\release-x.xx。\n');
  } catch (error) {
    // 构建中途失败时，把用户数据放回去，避免丢失。
    if (movedData && await exists(preserveDir)) {
      await fsp.mkdir(finalDir, { recursive: true }).catch(() => {});
      await fsp.rename(preserveDir, finalData).catch(() => {});
    }
    await fsp.rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

main().catch((error) => {
  console.error(`\n构建失败：${error.message}`);
  process.exit(1);
});
