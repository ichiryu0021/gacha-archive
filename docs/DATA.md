# 数据与规则

## 数据目录

所有持久数据位于软件目录 `data/`：

| 文件/目录 | 内容 |
|---|---|
| `app.json` | 账号、五星记录、总抽数、历史汇总、设置 |
| `app.json.bak` | 最近一次备份 |
| `backups/` | 更新前/手动备份 |
| `uploads/` | 截图临时文件 |
| `assets/` | 图片缓存 |
| `miyoushe-session.dat` | 米游社登录态，DPAPI 加密 |
| `catalog-*.json` | 各游戏图鉴 |
| `versions-*.json` | 版本时间表 |
| `up-pools.json` | 常驻/非 UP 角色名单 |
| `electron/` | Electron 缓存，已从 AppData 迁入 |

AppData 只用于读取游戏自身日志，不写入米游档案数据。

## 记录结构

`app.json` 中每个账号的五星记录主要字段：

| 字段 | 说明 |
|---|---|
| `id` | 官方记录 ID 或本地合成 ID |
| `time` | 记录时间，可为空 |
| `name` | 角色/武器/邦布名 |
| `rank` | 固定 5 |
| `gachaType` / `uigfType` | 卡池类型 |
| `pity` | 出金抽数 |
| `up` | `win` / `loss` / 空 |
| `version` | `x.xx`；Excel 可留空 |
| `source` | official / manual / uigf / screenshot 等 |
| `order` | 手动表格顺序，第一行最新为 0 |

总抽数按“记录全量”统计；五星只保存五星。

## UP 判定

`data/up-pools.json`：

- `standard5`：常驻五星。
- `nonUp5`：星缘相邀等非 UP 限定。
- 判定时合并两个列表：命中则 `loss`，否则 `win`。
- 有日期按日期判断；没有日期但有版本时，按 `standardAddedVersion` 判断；早于加入版本算 UP。
- 修改名单后重新打开软件，现有记录会重新判定。
- 当前版本字段为 `version`，更新日期为 `updatedAt`。

## Excel 导入

列固定为：

| 名称 | 卡池 | 版本 | 抽数 | 时间 |
|---|---|---|---|---|

- 第一行必须是最新记录，向下从新到旧。
- UP/歪不填写，由软件判断。
- 卡池可写名称或类型编号；版本、时间可留空。
- 模板中的「说明」工作表不属于导入数据。

## 隐私

- 抽卡 authkey 只保存在内存，不写入磁盘。
- 米游社登录态用 Windows DPAPI 加密。
- 分享图只在本机生成。
