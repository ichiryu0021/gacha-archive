import fs from 'node:fs';
import path from 'node:path';

const ID_RE = /^[a-z][a-z0-9-]*$/;
const RESERVED = new Set(['runtime', 'schema', 'node_modules']);

function readJson(file) {
  try {
    const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * 源项目里主题在 <root>/themes；打包后在 resources/app 的 ../../themes。
 */
export function resolveThemeRoot(appRoot) {
  const candidates = [
    path.join(appRoot, '..', '..', 'themes'), // 打包后用户可放主题的程序根目录
    path.join(appRoot, 'themes'),             // 源项目 / 更新器兼容的内置副本
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'registry.json'))) || candidates[1];
}

/**
 * 扫描主题目录。registry.json 只负责默认值和排序，新主题文件夹即使没有
 * 登记，也会因为存在 theme.json 被自动发现。
 */
export function readThemeCatalog(themeRoot) {
  const registry = readJson(path.join(themeRoot, 'registry.json')) || {};
  const order = Array.isArray(registry.themes) ? registry.themes.map((item) => item && item.id).filter(Boolean) : [];
  const themes = [];
  let dirs = [];
  try { dirs = fs.readdirSync(themeRoot, { withFileTypes: true }); } catch { /* empty */ }
  for (const entry of dirs) {
    if (!entry.isDirectory() || RESERVED.has(entry.name) || entry.name.startsWith('.')) continue;
    const directory = entry.name;
    const manifestFile = path.join(themeRoot, directory, 'theme.json');
    const manifest = readJson(manifestFile);
    if (!manifest || manifest.id !== directory || !ID_RE.test(manifest.id)) continue;
    if (!['package', 'variant', 'builtin'].includes(manifest.mode)) continue;
    const assets = manifest.assets && typeof manifest.assets === 'object'
      ? { css: String(manifest.assets.css || ''), js: manifest.assets.js ? String(manifest.assets.js) : '' }
      : null;
    if (manifest.mode === 'package') {
      if (!assets || !assets.css) continue;
      const cssFile = path.resolve(themeRoot, directory, assets.css);
      if (!cssFile.startsWith(path.resolve(themeRoot, directory) + path.sep) || !fs.existsSync(cssFile)) continue;
    }
    if (manifest.mode === 'variant' && !ID_RE.test(String(manifest.extends || ''))) continue;
    themes.push({
      ...manifest,
      directory,
      assets,
      name: manifest.name || manifest.id,
      en: manifest.en || String(manifest.id).toUpperCase(),
      description: manifest.description || '',
    });
  }
  const rank = new Map(order.map((id, index) => [id, index]));
  themes.sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : order.length + 1;
    const rb = rank.has(b.id) ? rank.get(b.id) : order.length + 1;
    return ra - rb || a.id.localeCompare(b.id);
  });
  const fallback = themes.find((theme) => theme.id === 'mecha')?.id || themes[0]?.id || 'mecha';
  const defaultTheme = themes.some((theme) => theme.id === registry.defaultTheme) ? registry.defaultTheme : fallback;
  return {
    ok: true,
    interfaceVersion: '1.0',
    baseTheme: 'mecha',
    defaultTheme,
    themes,
  };
}

export function resolveThemeFile(themeRoot, id, relative) {
  if (!ID_RE.test(String(id || ''))) return null;
  const dir = path.resolve(themeRoot, id);
  const file = path.resolve(dir, relative);
  if (file !== dir && !file.startsWith(dir + path.sep)) return null;
  const ext = path.extname(file).toLowerCase();
  if (!['.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff2'].includes(ext)) return null;
  try {
    if (!fs.statSync(file).isFile()) return null;
  } catch { return null; }
  return file;
}
