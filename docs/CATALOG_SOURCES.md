# 图鉴数据源

更新时间：2026-11-19

## 目标

- 图鉴包含角色、武器/弧盘、稀有度、类型和图片。
- 能自动更新，也能离线使用内置快照。
- 优先官方数据/官方 wiki；没有公开接口时使用官方游戏资源镜像或社区 wiki，并在界面显示来源。

## 当前来源

| 游戏 | 数据 | 图片 | 更新方式 | 说明 |
|---|---|---|---|---|
| 原神 | HoYoWiki / 内置 7.2 | 米哈游 CDN | 内置 + 同步 | 官方来源 |
| 崩坏：星穹铁道 | HoYoWiki API | HoYoWiki 图标 | 启动/手动同步 | 官方来源 |
| 绝区零 | HoYoWiki API | HoYoWiki 图标 | 启动/手动同步 | 官方来源 |
| 明日方舟 | `Kengxxiao/ArknightsGameData` | `Aceship/Arknight-Images` | 启动检查 + 手动同步 | 游戏数据/图片资源镜像 |
| 终末地 | `MR-LORD-REX/endfield-py` 游戏数据 | Enka Network `ui/ef` | 启动检查 + 手动同步 | 数据为官方资源结构，图片为 Enka 镜像 |
| 异环 | `nte.nanoka.cc`（1.5.4） | `static.nanoka.cc` | 启动检查 + 手动同步 | 角色 26 + 弧盘 53，游戏资源镜像；BWIKI 太旧已替换 |

### 官方 wiki 说明

森空岛官方 wiki（`wiki.skland.com`）的目录/详情接口需要前端生成的签名，直接请求会返回 401；要做官方 wiki 同步，需要额外的浏览器签名/抓取流程。当前先用可稳定自动化的官方游戏数据镜像和社区 wiki，并在图鉴页显示实际来源。

## 自动更新策略

- 启动后延迟检查；第三方图鉴 7 天内已更新则跳过，避免每次下载大文件。
- 图鉴页「同步图鉴」按钮强制更新。
- 同步失败时保留现有本地/内置快照，不清空图鉴。
- 图片直连 CDN，失败时由界面显示占位图；代理接口仍保留给米哈游资源。

## 内置快照

- `src/data/catalog-arknights.json`：404 个角色，全部带头像。
- `src/data/catalog-endfield.json`：34 个角色 + 80 件武器，全部带图标。
- `src/data/catalog-nte.json`：26 个角色 + 53 个弧盘，全部带图标。

这些文件在没有网络或用户数据目录还没有图鉴时兜底。

## 许可与署名

- HoYoWiki/HoYoverse：官方 wiki。
- Kengxxiao/ArknightsGameData：游戏数据整理。
- Aceship/Arknight-Images：明日方舟图片资源。
- MR-LORD-REX/endfield-py：终末地数据整理。
- Enka Network：终末地图片资源。
- 异环 nanoka.cc NTE 数据站：社区游戏数据/图标镜像。

正式分发时保留来源标注；不要把第三方图片当作自有素材。
