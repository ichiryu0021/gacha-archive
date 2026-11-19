# 开发版构建与 dist 目录规则

> 生效日期：2026-11-19
> 适用范围：Windows 便携版（Electron + `scripts/pack.cjs`）

## 0. 发布授权规则（必须遵守）

自 2026-11-19 起，发布动作必须由用户**明确授权**：

- 用户没有明确说「打包上传 / push / 发布 / 创建 Release / 迭代版本」时：
  - **不要 `git push`**
  - **不要创建或移动 tag**
  - **不要创建/修改 GitHub Release**
  - **不要上传任何发布资产**
  - **不要修改版本号**（`package.json`、`displayVersion`、`src/config.js`、tag、资产文件名）
- 用户只说「检查 / 修复 / 改一下 / 优化」时，只做本地修改和本地验证，不自动发布。
- 允许本地 `npm.cmd run pack` 生成 `dist\二游档案` 开发版；这不等于发布。
- 需要 push、打 tag、上传 Release 或迭代版本时，必须在动手前得到用户对**具体动作**的明确指令。
- 版本号一旦确定，未经用户明确要求不要自行递增。

## 1. 唯一规则

1. **开发版唯一输出目录：`D:\Project\二游档案\dist\二游档案`**
   每次构建都覆盖这里的程序文件；不新增版本化目录。
2. **发布补丁 / 完整包直接放 `dist\`**
   例如 `dist\gacha-hotfix-v2.02.zip`、`dist\gacha-v2.02-full.zip`。
3. **不再创建 `dist\release-x.xx`、`dist\<版本号>` 等子目录。**
   版本只写在 `package.json`、`displayVersion` 和 zip 文件名里，不写在文件夹名里。
4. **`dist\二游档案\data` 是用户真实数据。**
   构建必须保留，禁止删除、覆盖或打包进程序目录。
5. **开发版内置「机能」主题。**
   构建时把 `themes/mecha/theme.css` 复制为 `theme-base.css`、`themes/runtime/theme-loader.js` 复制为 `theme-loader.js` 并注入 `index.html`；默认「机能 · 黑」，可切「机能 · 白」/「经典」，支持按游戏映射，选择用 Cookie 保存在 `data/electron/`。程序根目录同时放完整 `themes/`（排除 `.theme-state.json`）。
6. **`dist/` 已被 `.gitignore` 忽略**，构建产物不提交。

## 2. 目录结构

```text
D:\Project\二游档案\
└─ dist\
   ├─ 二游档案\                 # 唯一开发版
   │  ├─ 二游档案.exe
   │  ├─ resources\app\         # 程序文件
   │  └─ data\                  # 用户数据（构建保留）
   ├─ gacha-hotfix-v2.02.zip    # 发布资产，直接放 dist
   ├─ gacha-v2.02-full.zip
   ├─ 二游档案-v2.00.zip        # 历史命名的完整包
   ├─ miyou-hotfix.zip          # 历史资产
   ├─ 米游档案 V1.07.zip ...    # 历史版本
   └─ backup-app-...            # 历史备份（不要自动清理）
```

## 3. 更新开发版

每次改完源码，需要更新本地可运行版本时执行：

```powershell
cd D:\Project\二游档案
npm.cmd run pack
```

或直接调用脚本：

```powershell
node scripts\pack.cjs
```

说明：

- `npm.cmd` 而不是 `npm`，避免 PowerShell 执行策略拦截 `npm.ps1`。
- 构建先写入 `dist\.pack-staging`，成功后再替换 `dist\二游档案`。
- 替换前会把旧的 `dist\二游档案\data` 移到临时目录，替换完再移回；构建失败也会尝试恢复。
- Electron 二进制优先复用 `%LOCALAPPDATA%\electron\Cache` 中的 `electron-v<版本>-win32-x64.zip`，避免网络抖动导致构建失败；缓存未命中才会联网下载。也可用 `ELECTRON_ZIP_DIR` 显式指定包含该 zip 的目录。
- 如果 `二游档案.exe` 正在运行，替换会失败并保持原样。先完全退出应用，再重新构建。
- 第一次构建没有旧 `data` 时，会提示首次运行自动创建。
- 构建把 `themes/mecha/theme.css` 复制为 `resources/app/public/theme-base.css`、`themes/runtime/theme-loader.js` 复制为 `theme-loader.js` 并注入首屏引导；主题清单/CSS 由加载器从根目录 `themes/` 动态读取。完整 `themes/` 复制到 `dist\二游档案\themes`（排除 `.theme-state.json`）。完整包会带上主题文件夹；热更新包只替换 `resources/app`，不覆盖根目录。
- **开发版启动默认「机能 · 黑」**：设置页主题卡片可切「机能 · 白」/「经典」；选择写入 `ga_theme` Cookie，随 Electron 的 `data/electron/` 保留，下次启动沿用。
- 主题注入只发生在打包产物中，原项目 `public/index.html`、`src/` 不改；本轮 `public/app.js` 另有「米游社同步」小功能改动，属于应用功能，随正常打包进入开发版。
- 构建不会把 `data/`、`.dat` 登录态、`docs/`、`tests/`、`demo-data/` 打进程序目录。

构建完成后确认：

```powershell
# 程序版本
(Get-Content 'dist\二游档案\resources\app\package.json' -Raw | ConvertFrom-Json) |
  Select-Object name, version, displayVersion

# 用户数据仍在
Test-Path 'dist\二游档案\data\app.json'

# 主题已注入
Test-Path 'dist\二游档案\resources\app\public\theme-loader.js'
Select-String -Path 'dist\二游档案\resources\app\public\index.html' -Pattern 'mechaEmbedded'
```

期望 `name` 为 `gacha-archive`、`version` 为 `2.03`、`displayVersion` 为 `2.03`（随版本更新变化），`app.json` 存在，`index.html` 含主题注入标记。

## 4. 为什么不能直接打包到 `dist\二游档案`

`@electron/packager` 在 `overwrite: true` 时会先递归删除整个输出目录：

```js
await fs.promises.rm(outDir, { recursive: true, force: true });
```

如果直接以 `out: 'dist'` 打包，`dist\二游档案\data` 会被一起删掉。因此：

- **只能通过 `npm.cmd run pack` / `node scripts\pack.cjs` 构建开发版**；
- 不要把 `electron-packager` 直接指向 `dist` 或 `dist\二游档案`；
- 不要在 `dist\二游档案` 里手动删除 `data\`。

## 5. 发布资产

- 发布用的热更新包、完整包统一放 `dist\` 根目录，不新建 release 文件夹。
- 当前保留的资产：
  - `dist\gacha-hotfix-v2.02.zip`
  - `dist\gacha-v2.02-full.zip`
  - `dist\二游档案-v2.00.zip`（历史命名）
  - `dist\miyou-hotfix.zip`（历史资产）
- 资产命名必须带版本号；不要用 `release-2.00` 这样的目录来表达版本。
- 热更新包结构、完整包结构和 GitHub Release 规则见 [docs/RELEASE.md](docs/RELEASE.md)。
- 打包前确认 `dist\二游档案\resources\app` 是当前构建，再压缩；不要从旧目录复制。
- v2.00 的 zip 是**集成主题前**的历史产物；当前发布包以 v2.02 为准，必须从当前 `dist\二游档案` 重新生成 zip。

## 6. 数据保护

以下内容只属于本机用户，不进入发布包：

- `data\app.json`、`app.json.bak`、`app.json.before-*`
- `data\*.dat`（米游社 / 森空岛 / 塔吉多登录态）
- `data\backups\`、`uploads\`、`assets\`、`imports\`、`nte-captures\`
- `data\electron\`

`dist\二游档案\data` 是便携版运行时的权威数据目录。重新构建程序文件时：

- 旧 `data` 会完整保留；
- 构建脚本不把仓库里的 `data/` 复制到最终开发版；
- 仓库里的 `data/` 只用于提供图鉴 / 版本 / 卡池基础文件，且敏感文件会被忽略规则排除。

## 7. 版本与目录的对应关系

| 内容 | 位置 |
|---|---|
| 内部版本 | `package.json.version` |
| 界面显示版本 | `package.json.displayVersion`、`src/config.js` |
| 开发版程序 | `dist\二游档案` |
| 热更新包 | `dist\gacha-hotfix-v<显示版本>.zip` |
| 完整包 | `dist\gacha-v<显示版本>-full.zip` |
| 发布说明 | GitHub Release / `docs/RELEASE.md` |

发版时不要因为版本变化新建 `dist\2.01`、`dist\release-2.01` 等文件夹。

## 8. 整理记录（2026-11-19）

- 删除旧的 `dist\release-2.00` 目录。
- 把其中的发布 zip 移到 `dist\` 根目录：
  - `gacha-hotfix-v2.00.zip`
  - `gacha-v2.00-full.zip`
  - `二游档案-v2.00.zip`
- `dist\二游档案` 已用当前源码重新构建，`data\` 保持原样（`app.json` 前后哈希一致）。
- `package.json` 移除了 `pack:release`，只保留固定的 `pack`。
- 开发版构建加入「机能」主题：复制 `themes/mecha/theme.css` 和 `themes/runtime/theme-loader.js`，注入基础样式和动态加载器；默认机能 · 黑，可切机能 · 白 / 经典，支持按游戏映射和 Cookie 持久化。
- 主题目录、清单、注册表和接口标准见 [`themes/README.md`](themes/README.md) 与 [`themes/THEME-INTERFACE.md`](themes/THEME-INTERFACE.md)；`node themes/validate.mjs` 可校验清单。
- 字体/入口专项 **7/7**，内置构建功能 **17/17**，原项目测试 **31/31**。
- `themes/` 会完整复制到程序根目录（排除运行状态文件）；独立主题入口 `themes/mecha/server.mjs` 也保留在主题目录中。
- 构建脚本加入敏感文件忽略规则（`.dat`、`app.json*`）。

## 9. 检查清单

```powershell
npm.cmd test
node --check scripts\pack.cjs
npm.cmd run pack

# 确认产物
(Get-Content 'dist\二游档案\resources\app\package.json' -Raw | ConvertFrom-Json) |
  Select-Object name, version

# 确认用户数据未动
Get-FileHash 'dist\二游档案\data\app.json' -Algorithm SHA256

# 确认没有版本化目录 / 临时目录
Get-ChildItem dist -Force | Where-Object { $_.Name -match 'release-|^\.pack-|^\.data-' }
```

- [ ] `dist\二游档案\resources\app\package.json` 版本正确
- [ ] `dist\二游档案\data\app.json` 存在且构建前后哈希一致
- [ ] `dist\` 下没有 `release-*` 目录
- [ ] 没有 `.pack-staging` / `.data-preserve-*` 残留
- [ ] `resources\app\data` 内没有 `.dat`、`app.json*`
- [ ] `resources\app\public\theme-base.css|theme-loader.js` 存在，`index.html` 含主题加载器
- [ ] 启动 `dist\二游档案\二游档案.exe` 默认是「机能 · 黑」；切「机能 · 白」/「经典」后重启仍为所选
- [ ] 发布 zip 直接位于 `dist\`，文件名带版本





