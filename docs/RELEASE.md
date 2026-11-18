# 发布与更新规则

## 版本

| 位置 | 含义 | 当前示例 |
|---|---|---|
| `package.json.version` | 内部 semver | `1.8.0` |
| `package.json.displayVersion` | 界面显示 | `1.08` |
| `src/config.js` | 服务端版本常量 | `1.8.0` / `1.08` |
| GitHub tag | 发布版本 | `v1.08` |

显示版本只使用 `x.xx`。

## 母版

- 基线母版：`v1.06`。
- 小版本与补丁从母版增量构建，不重新设计结构。
- 整数版本 `2.00`、`3.00` 等为大版本；大版本必须提供完整包。

## 资产

| 资产 | 用途 | 命名 |
|---|---|---|
| 最小更新包 | 旧版本升级，只含 `resources/app` | `miyou-hotfix.zip` |
| 完整包 | 新用户安装、大版本、热更新失败兜底 | `Vx.xx.zip` |

- 热更新包内需要一个占位 `.exe` 和 `resources/app`，更新器只复制 app 目录。
- 完整包顶层文件夹为 `米游档案-win32-x64`，排除顶层 `data/`。
- 资产在 GitHub 上设置中文 label。

## 更新流程

1. 启动时由界面检查最新 Release，顶栏显示新版本提示。
2. 点击更新：优先下载 `miyou-hotfix.zip`。
3. 校验包结构、`package.json` 版本、关键文件。
4. 备份当前 `resources/app` 到 `data/backups/`。
5. 替换 `resources/app`，再次自检，成功后自动重启。
6. 热更新失败：提示“是否下载完整版？不会丢失数据。”；完整版仍只替换程序文件。

## 数据保护

- 更新和打包永远不包含顶层 `data/`。
- 不删除 `app.json`、`backups/`、`uploads/`、`assets/`、`miyoushe-session.dat`。
- 大版本允许必要的程序目录结构调整，但不得迁移或清空用户数据。

## 发布检查清单

```powershell
npm.cmd test
node --check src/server.js
node --check public/app.js
node --check electron/updater.cjs
```

- 确认 `package.json`、`src/config.js`、README 版本一致。
- 构建热更新包与完整包。
- 完整包确认没有顶层 `data/`。
- 推送源码到 `main`，创建 tag，再创建 Release。
- 上传资产并设置中文 label。
