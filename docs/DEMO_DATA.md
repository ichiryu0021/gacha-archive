# 模拟数据

生成一份五款游戏的演示数据，不覆盖用户正式数据。

```powershell
node scripts\seed-demo-data.mjs demo-data
```

输出到 `demo-data/`，包含：

- 原神 15 条五星
- 星铁 15 条五星
- 绝区零 10 条五星
- 崩坏3 5 条五星
- 未定 4 条五星
- 各卡池总抽数、当前垫抽、版本、常驻/UP 状态

启动本地服务查看：

```powershell
$env:GACHA_DATA_DIR="$PWD\demo-data"
node src\server.js
```

`demo-data/` 不随发布包分发。
