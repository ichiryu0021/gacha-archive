# 架构说明

## 运行形态

- 桌面壳：Electron，入口 `electron/main.cjs`。
- 本地服务：Node.js ESM，入口 `src/server.js`，只监听 `127.0.0.1` 随机端口。
- 界面：`public/` 静态页面，由本地服务提供，不使用外部 CDN。
- 所有持久化数据位于软件目录的 `data/`，不写 AppData。

## 目录

| 路径 | 作用 |
|---|---|
| `electron/` | Electron 主进程、预加载、更新器 |
| `src/server.js` | HTTP API、静态资源、同步编排 |
| `src/api/` | 抽卡接口、缓存扫描、米游社、OCR、UIGF、采集器、第三方游戏同步 |
| `src/store.js` | `data/app.json` 读写、合并、备份 |
| `public/` | 单页界面、样式、分享图 |
| `data/` | 随包图鉴、版本表、非 UP 名单 |
| `tests/` | 核心逻辑测试 |

## 数据流

1. 自动读取：从本机游戏缓存拿到抽卡链接，调用官方抽卡接口，读取全部记录计算总抽数，只落库五星。
2. 米游社：扫码登录后签发 authkey；绝区零优先调用米游社全量统计，直接覆盖全量总抽数。
3. 手动录入：单个表单或 Excel 表格，只写五星；UP/歪由 `src/api/analyze.js` 重新判定。
4. UIGF：支持 v4/v3、SRGF v1，导入后合并到本地 `app.json`，不保存原文件。
5. 第三方游戏：森空岛扫码后同步明日方舟 / 终末地；终末地也可直接读本机链接；异环通过塔吉多短信登录同步。详见 `docs/THIRD_PARTY_GACHA_APIS.md`。
6. 分享：前端 Canvas 生成 JPG，Electron `clipboard`/保存对话框输出。

## 更新

- `electron/updater.cjs` 从 GitHub Release 读取资产。
- 小版本优先使用 `miyou-hotfix.zip`；整数大版本强制使用完整包。
- 更新只替换 `resources/app`，不触碰顶层 `data/`。
- 更新器带版本/关键文件自检；热更新失败时前端提示是否转完整版。
- 详细发布规则见 `docs/RELEASE.md`。

## 约束

- 不引入需要联网才能启动的运行时依赖。
- 界面不显示无意义说明文字；功能提示保持短句。
- 任何会删除用户数据的改动必须先确认。
- 用户数据目录不进入 Git，不进入发布 zip。
