const path = require('node:path');
const { packager } = require('@electron/packager');

const out = path.resolve(process.argv[2] || 'dist');
const root = path.resolve(__dirname, '..');
const ignoredRoots = new Set(['dist', 'docs', 'tests']);
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
  if (rel === 'demo-data' || rel.startsWith('demo-data/')) return true;
  if (rel === 'node_modules/.bin' || rel.startsWith('node_modules/.bin/')) return true;
  if (rel === 'node_modules/electron' || rel.startsWith('node_modules/electron/')) return true;
  if (rel === 'node_modules/@electron' || rel.startsWith('node_modules/@electron/')) return true;
  return ignoredRoots.has(rel.split('/')[0])
    || ignoredData.has(rel)
    || [...ignoredDataDirs].some((dir) => rel === dir || rel.startsWith(`${dir}/`))
    || rel === 'scripts/pooltable.snippet.txt';
}

packager({
  dir: root,
  name: '二游档案',
  platform: 'win32',
  arch: 'x64',
  out,
  overwrite: true,
  asar: false,
  icon: path.join(root, 'public', 'icon.ico'),
  prune: true,
  ignore,
}).then(([folder]) => {
  console.log(`Packaged: ${folder}`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
