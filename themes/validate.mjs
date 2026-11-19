#!/usr/bin/env node
/**
 * 主题清单校验：不依赖第三方包。
 * 用法：node themes/validate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const themesRoot = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    fail(`${path.relative(themesRoot, file)} 无法读取或不是合法 JSON：${error.message}`);
    return null;
  }
}

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

const registryFile = path.join(themesRoot, 'registry.json');
const registry = readJson(registryFile);
if (registry) {
  if (registry.interfaceVersion !== '1.0') fail('registry.interfaceVersion 必须是 1.0');
  if (!isString(registry.defaultTheme)) fail('registry.defaultTheme 缺失');
  if (!Array.isArray(registry.themes) || !registry.themes.length) fail('registry.themes 必须是非空数组');
}

const ids = new Set();
const directories = new Set();
const manifests = new Map();

for (const entry of registry?.themes || []) {
  if (!isString(entry?.id) || !/^[a-z][a-z0-9-]*$/.test(entry.id)) {
    fail(`registry.themes 中存在非法 id：${JSON.stringify(entry)}`);
    continue;
  }
  if (!isString(entry?.directory) || !/^[a-z][a-z0-9-]*$/.test(entry.directory)) {
    fail(`registry.themes 中 ${entry.id} 的 directory 非法`);
    continue;
  }
  if (ids.has(entry.id)) fail(`主题 id 重复：${entry.id}`);
  ids.add(entry.id);
  if (directories.has(entry.directory)) fail(`主题目录重复：${entry.directory}`);
  directories.add(entry.directory);
  const manifestFile = path.join(themesRoot, entry.directory, 'theme.json');
  const manifest = readJson(manifestFile);
  if (!manifest) continue;
  manifests.set(entry.id, { manifest, directory: entry.directory, manifestFile });
}

// 自动发现未登记目录：运行时也是按目录扫描，registry 只做默认/排序。
for (const entry of fs.readdirSync(themesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.') || ['runtime', 'schema', 'node_modules'].includes(entry.name)) continue;
  if (directories.has(entry.name)) continue;
  const manifestFile = path.join(themesRoot, entry.name, 'theme.json');
  if (!fs.existsSync(manifestFile)) continue;
  const manifest = readJson(manifestFile);
  if (!manifest) {
    fail(`${path.relative(themesRoot, manifestFile)} 不是合法 JSON`);
    continue;
  }
  if (!isString(manifest.id)) {
    fail(`${path.relative(themesRoot, manifestFile)} 缺少 id`);
    continue;
  }
  if (ids.has(manifest.id)) fail(`主题 id 重复：${manifest.id}`);
  ids.add(manifest.id);
  directories.add(entry.name);
  manifests.set(manifest.id, { manifest, directory: entry.name, manifestFile });
}

for (const [id, { manifest, directory, manifestFile }] of manifests) {
  const where = path.relative(themesRoot, manifestFile);
  if (manifest.id !== id) fail(`${where} 的 id "${manifest.id}" 与 registry 的 "${id}" 不一致`);
  if (manifest.interfaceVersion !== '1.0') fail(`${where} 的 interfaceVersion 必须是 1.0`);
  for (const key of ['name', 'en', 'version']) {
    if (!isString(manifest[key])) fail(`${where} 缺少 ${key}`);
  }
  if (!['package', 'variant', 'builtin'].includes(manifest.mode)) fail(`${where} 的 mode 非法`);
  if (!['dark', 'light', 'classic'].includes(manifest.variant)) fail(`${where} 的 variant 非法`);
  if (!manifest.capabilities || typeof manifest.capabilities !== 'object') {
    fail(`${where} 缺少 capabilities`);
  } else {
    for (const key of ['settingsCard', 'cookie', 'standaloneApi', 'animations', 'reducedMotion', 'embeddedBuild']) {
      if (typeof manifest.capabilities[key] !== 'boolean') fail(`${where} capabilities.${key} 必须是布尔值`);
    }
  }
  if (manifest.mode === 'package') {
    if (!manifest.assets || !isString(manifest.assets.css)) {
      fail(`${where} 的 package 主题缺少 assets.css`);
    } else {
      const assets = [manifest.assets.css, manifest.assets.js].filter(Boolean);
      for (const asset of assets) {
        if (!fs.existsSync(path.join(themesRoot, directory, asset))) {
          fail(`${where} 引用的资源不存在：${asset}`);
        }
      }
    }
  }
  if (manifest.mode === 'variant') {
    if (!isString(manifest.extends)) {
      fail(`${where} 的 variant 主题缺少 extends`);
    } else if (!manifests.has(manifest.extends)) {
      fail(`${where} 的 extends 指向不存在的主题：${manifest.extends}`);
    } else if (manifests.get(manifest.extends).manifest.mode !== 'package') {
      fail(`${where} 的 extends 必须指向 package 主题`);
    }
    if (manifest.assets) fail(`${where} 的 variant 主题不应声明 assets`);
  }
  if (manifest.mode === 'builtin' && manifest.assets) fail(`${where} 的 builtin 主题不应声明 assets`);
  if (manifest.preview && !fs.existsSync(path.join(themesRoot, manifest.preview))) {
    fail(`${where} 的 preview 不存在：${manifest.preview}`);
  }
}

if (!registry?.themes?.some((entry) => entry.id === registry.defaultTheme)) {
  fail(`defaultTheme "${registry?.defaultTheme}" 不在 registry.themes 中`);
}

if (!errors.length) {
  const themeList = [...manifests.keys()].join(' / ');
  console.log(`主题清单校验通过：${manifests.size} 个主题，默认 ${registry.defaultTheme}`);
  console.log(`  ${themeList}`);
  if (warnings.length) warnings.forEach((warning) => console.warn(`  警告：${warning}`));
  process.exit(0);
}

console.error(`主题清单校验失败：${errors.length} 个错误`);
for (const message of errors) console.error(`  - ${message}`);
if (warnings.length) for (const message of warnings) console.warn(`  - 警告：${message}`);
process.exit(1);
