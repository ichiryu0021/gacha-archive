# 第三方组件与数据来源

本项目代码采用 MIT License。

## 开源组件

- **Electron** — MIT License — https://github.com/electron/electron
- **QR Code Generator for JavaScript** — Copyright (c) 2009 Kazuhiko Arase — MIT License — http://www.d-project.com/
- **genshin-db** — MIT License — https://github.com/theBowja/genshin-db
- **SheetJS xlsx** — Apache License 2.0 — https://github.com/SheetJS/sheetjs
- **NTE Gacha Exporter CLI** — MIT License — https://github.com/Anong0u0/NTE_Gacha_Exporter

## 段位方案（数码管）

- 界面「总抽数」用的是**通力（KONE）电梯 57 段数码管**的分段样式。
- `public/lcd-segments.js` 里的 57 条矢量段路径，是**按通力官网公开的分段样式自行描摹**的，
  属于本项目自有的二创矢量数据（描摹原稿本地保留，不入库），
  不包含、也不依赖任何第三方字体文件。
- 早期实现曾借用社区二创字体《KONE 57-segment LCD》（FontStruct，作者 Szymek）
  作为「每个字符点亮哪些段」的**参考**；该字体文件既未随项目分发，现也已从运行链路中移除。
- 「KONE」为通力公司商标，本项目为非官方工具，与该品牌无隶属关系。

## 数据与素材

- 原神图鉴基础数据来自 genshin-db（MIT）。
- 星穹铁道、绝区零图鉴数据来自 HoYoWiki 官方 Wiki 接口。
- 游戏角色、武器、图标、名称等版权归 miHoYo / HoYoverse 所有。
- 明日方舟 / 终末地 / 异环的接口协议参考了社区开源项目（仅作协议研究，未复制其代码）：
  - Arkntools 明日方舟寻访导出：https://github.com/arkntools/arknights-gacha-export
  - nonebot-plugin-skland / astrbot_plugin_sklandv2：https://github.com/FrostN0v0/nonebot-plugin-skland
  - 终末地抽卡工具 bhaoo/endfield-gacha：https://github.com/bhaoo/endfield-gacha
  - Skport / Gryphline API 文档：https://github.com/AixLnyt/skport-api-docs
  - NTEUID 异环抽卡存档：https://github.com/tyql688/nteuid
  - NTE Gacha Exporter 异环封包抓取：https://github.com/Anong0u0/NTE_Gacha_Exporter
- 明日方舟 / 终末地 / 异环的角色、武器、卡池名称等版权归 Hypergryph / Gryphline / 完美世界 / Hotta Studio 各自所有。
- 本项目为非官方工具，与上述公司无隶属关系。

## 许可说明

项目源代码采用 MIT License；第三方组件和数据按其各自许可证使用。游戏素材不随 MIT License 授权。
