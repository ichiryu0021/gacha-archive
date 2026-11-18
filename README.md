# 米游档案

本地优先的米哈游抽卡记录归档工具，支持原神、崩坏：星穹铁道、绝区零，以及崩坏3、未定事件簿。

所有抽卡数据保存在自己电脑的软件目录里，不上传云端，不依赖账号，不写 AppData。无广告、无捆绑、无后台推广，纯绿色便携使用。

![生涯概览](https://raw.githubusercontent.com/ichiryu0021/miyou-archive-assets/main/dashboard.png)

![五星记录](https://raw.githubusercontent.com/ichiryu0021/miyou-archive-assets/main/records.png)

![数据录入](https://raw.githubusercontent.com/ichiryu0021/miyou-archive-assets/main/manual.png)

## 核心功能

- **本地保存，防止数据丢失**：记录、备份、米游社登录态全部保存在软件目录 `data/`。
- **自动归档**：读取本机游戏缓存和官方抽卡接口，自动合并五星记录。
- **五星档案**：只保留五星，按卡池分组，统计出金抽数、UP/歪、命中率、平均出金。
- **已垫抽计数**：按卡池显示当前垫抽，方便知道自己已经垫了多少抽、距离保底还有多少。
- **版本统计**：按版本查看抽数、五星和生涯覆盖。
- **多种录入方式**：自动读取、粘贴链接、截图 OCR、手动添加、Excel 表格、UIGF 导入。
- **分享总结**：一键生成 JPG 抽卡总结，可复制到剪贴板或保存文件。
- **本地备份**：支持 UIGF、CSV 导出和整库备份。
- **自动更新**：启动检查新版本，小版本走最小更新，更新不覆盖用户数据。

## 支持游戏

| 游戏 | 自动同步 | 手动/Excel | 分享 | 版本统计 |
|---|---|---|---|---|
| 原神 | ✓ | ✓ | ✓ | ✓ |
| 崩坏：星穹铁道 | ✓ | ✓ | ✓ | ✓ |
| 绝区零 | ✓ | ✓ | ✓ | ✓ |
| 崩坏3 | — | ✓ | ✓ | 手动 |
| 未定事件簿 | — | ✓ | ✓ | 手动 |

崩坏3、未定没有公开抽卡接口，使用手动录入和 Excel 兜底。

## 数据与隐私

- 数据目录：软件目录下的 `data/`
- 不写入 `%APPDATA%`
- 抽卡 authkey 只保存在内存，不落盘
- 米游社登录态使用 Windows DPAPI 加密
- 不收集使用数据，不上传抽卡记录

## 启动

- 便携版：运行 `米游档案-win32-x64/米游档案.exe`
- 源码运行：安装 Node.js 22.5+ 后执行 `npm install`，再运行 `npm start`

## 开发

```powershell
npm install
npm start
npm test
```

## 开源与致谢

- 代码：MIT License
- Electron：MIT
- QR Code Generator for JavaScript：MIT
- genshin-db：MIT
- SheetJS xlsx：Apache-2.0
- 星穹铁道 / 绝区零图鉴：HoYoWiki 官方数据
- 游戏素材版权归 miHoYo / HoYoverse 所有；本项目为非官方工具

详细许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
