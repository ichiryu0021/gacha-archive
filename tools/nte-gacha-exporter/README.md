# NTE Gacha Exporter CLI

内置的《异环》抽卡记录抓取组件，版本 `1.2.9`。

- 来源：https://github.com/Anong0u0/NTE_Gacha_Exporter
- 许可证：MIT，见同目录 `LICENSE`
- 文件：`nte-gacha-exporter-cli.exe`
- 用法：由二游档案 Electron 主进程调用，不直接面向用户

## 模式

- 手动只读：`capture --json <out> --locale zh-CN`
  - 不操作游戏；用户在游戏里翻抽卡记录，在控制台按 `q` 结束后写 JSON。
- 自动翻页：`capture --json <out> --locale zh-CN --auto-page`
  - 会控制游戏窗口翻页，仅在用户明确确认后使用。

## 权限

pktmon 抓包需要管理员权限。CLI 会自行通过 Windows UAC 重新启动提权进程；二游档案不会保存管理员凭据。

## 隐私

只读取本机游戏封包中的抽卡记录，不上传；输出暂存于 `data/nte-captures/`，导入后由用户自行清理。
