# 第三方游戏抽卡接口调查

> 调查时间：2026-11-19  
> 目标：确认《明日方舟》《明日方舟：终末地》《异环》能否接入本软件，并记录已实现的接入方式。

## 结论

| 游戏 | 官方数据源 | 自动同步 | 历史范围 | 可接入性 |
|---|---|---|---|---|
| 明日方舟 | 鹰角官网寻访记录 / 森空岛 | 森空岛扫码 + 官方接口 | 约 90 天（窗口） | 已接入 |
| 明日方舟：终末地 | `ef-webview` 寻访记录页 | 本机日志链接 / 手动粘贴 URL / 森空岛 | 约 90 天（窗口） | 已接入 |
| 异环 | 塔吉多 App 抽卡分析 | 手机号 + 短信验证码登录 / NTEUID 导入 | 约 180 天（S 区间） | 已接入（实验性） |

三款游戏都只把**最高稀有度**写入本地档案：明日方舟 / 终末地记为 `rank=5` 的六星，异环记为 `rank=5` 的 S 级。界面会按游戏显示“六星”或“S级”，底层仍复用现有五星档案结构。

## 1. 明日方舟（Arknights）

### 认证链路

1. `POST https://as.hypergryph.com/general/v1/gen_scan/login`
   - body：`{ "appCode": "4ca99fa6b56cc2ba" }`
   - 返回 `data.scanId`、`data.scanUrl`（`hypergryph://scan_login?scanId=...`），用森空岛 App 扫码。
2. `GET https://as.hypergryph.com/general/v1/scan_status?scanId=...`
   - `status=100` 未扫码，`status=101` 已扫码待确认，`status=0` 确认。
   - 确认后 `data.scanCode` 可换取登录凭据。
3. `POST https://as.hypergryph.com/user/auth/v1/token_by_scan_code`
   - body：`{ "scanCode": "..." }`
   - 返回鹰角通行证 `token`。
4. `POST https://as.hypergryph.com/user/oauth2/v2/grant`
   - body：`{ "token": "<通行证 token>", "appCode": "be36d44aa36bfb5b", "type": 1 }`
   - 返回网页端角色 token。
5. `GET https://binding-api-account-prod.hypergryph.com/account/binding/v1/binding_list?token=...`
   - 返回账号绑定的 `arknights` / `endfield` 角色、UID、渠道、区服。
6. `POST https://binding-api-account-prod.hypergryph.com/account/binding/v1/u8_token_by_uid`
   - body：`{ "uid": "...", "token": "<网页端角色 token>" }`
   - 返回对应游戏的 u8 token。
7. `POST https://ak.hypergryph.com/user/api/role/login`
   - body：`{ "token": "<u8 token>" }`
   - 通过 `Set-Cookie` 取得 `ak-user-center`。

### 寻访记录

- 类别：`GET https://ak.hypergryph.com/user/api/inquiry/gacha/cate?uid=...`
  - Header：`X-Account-Token`（通行证 token）、`X-Role-Token`（u8 token）、`Cookie: ak-user-center=...`
- 历史：`GET https://ak.hypergryph.com/user/api/inquiry/gacha/history`
  - 参数：`uid`、`category`、`size=100`，游标 `gachaTs` + `pos`
  - 返回 `data.gachaList` / `data.list`、`data.hasMore`
- 单条字段：`poolId`、`poolName`、`charId`、`charName`、`rarity`（0–5）、`isNew`、`gachaTs`（毫秒）、`pos`
- 六星对应 `rarity=5`，转换为档案时记 `rank=5`。
- 类别以 `cate` 的 `name` 为准（限定 / 中坚 / 联动 / 标准等），不能用卡池名 `poolName` 猜类别；`poolName` 是具体卡池名。
- 限定池保底不跨池，标准/中坚跨池；记录逐条 `pity` 按池分桶，界面上的“当前垫抽”取同类型最后一个池。
- 官方接口不返回“是否 UP”，本软件对明日方舟不做自动 UP/歪判定，保留原始卡池名。
- 保留期约 90 天；同步时用按天计数累加，窗口滑动不会让总抽数倒退。

### 旧接口说明

社区早期工具使用的 `https://ak.hypergryph.com/user/api/inquiry/gacha?page=1&token=...` 目前直接返回 HTML（需要网页登录态），已不作为主链路。官网旧数据窗口常被描述为“30 天 / 100 条”，新接口按类别分页，实际保留范围以接口返回为准。

## 2. 明日方舟：终末地（Endfield）

### 数据源

终末地在游戏内打开「寻访记录」时，会加载：

```
https://ef-webview.hypergryph.com/page/gacha_...?u8_token=...&server_id=1&...
```

国际服对应 `https://ef-webview.gryphline.com/...`。Windows 日志路径：

- 国服：`%USERPROFILE%\AppData\LocalLow\Hypergryph\Endfield\sdklogs\HGWebview.log`
- 国际服：`%USERPROFILE%\AppData\LocalLow\Gryphline\Endfield\sdklogs\HGWebview.log`

从日志中提取 `ef-webview...page/gacha_...` 链接即可拿到 `u8_token`，不需要账号密码。

### 接口

- 卡池类型：`GET /api/record/char/meta?token=&server_id=&lang=zh-cn`
- 角色记录：`GET /api/record/char?token=&server_id=&lang=zh-cn&pool_type=...&seq_id=...`
- 武器池列表：`GET /api/record/weapon/pool?token=&server_id=&lang=zh-cn`
- 武器记录：`GET /api/record/weapon?token=&server_id=&lang=zh-cn&pool_id=...&seq_id=...`
- 卡池详情：`GET /api/content?pool_id=&server_id=&lang=zh-cn`

> 记录接口首屏默认返回最新 5 条左右，必须用最后一条 `seqId` 作为下一页 `seq_id`，直到 `hasMore=false`；不要用固定页数截断。

角色池类型：

- `E_CharacterGachaPoolType_Special` 特许寻访
- `E_CharacterGachaPoolType_Rerun` 重构寻访
- `E_CharacterGachaPoolType_Joint` 辉光庆典
- `E_CharacterGachaPoolType_Standard` 基础寻访
- `E_CharacterGachaPoolType_Beginner` 启程寻访

武器池按 `poolId` 含 `constant` / `rerun` 区分常驻申领、重构申领，其余为限定申领。

记录字段：`charId` / `weaponId`、`charName` / `weaponName`、`rarity`、`gachaTs`（纯数字字符串，10/13 位秒/毫秒）、`seqId`、`poolId`、`poolName`、`isFree`、`isNew`、`kind`。`kind` 以 `gift` 开头的奖励记录需要剔除；免费抽计入总抽数，但不计入 6 星保底计数（与社区工具一致）。

UP 判定：从 `/api/content` 的 `up6_name` / `up6_item_name` / `rotate_list`（不是 `rotate_reward_item_list`）与 `all` 列表匹配 6 星 ID；`/api/content` 实测没有 `up6_id`。特许、重构、辉光庆典、限定申领、常驻申领、重构申领做 `win/loss` 判定。

保底：角色通用 80 小保底；特许 120 大保底（按池），重构 120 大保底（按 poolName 跨版本），辉光 80 独立；武器 40 小 / 80 大。本软件界面只展示小保底。

### 已验证 / 未验证

- 已验证：本机日志路径存在、链接格式、接口对无效 token 返回 `40100 Token is invalid`；`/api/content` 字段与无 `up6_id`。
- 未验证：有效 token 下的完整记录 JSON、每页条数、国际服 server_id、B 服行为；需要游戏内打开一次寻访记录后实测。
- 官方保留期约 90 天；同步按天累计，窗口滑动不会让旧总抽数缩水。

## 3. 异环（Neverness to Everness）

### 官方数据源

异环的官方抽卡分析在**塔吉多**（完美世界社区 App）内，接口：

- 登录：`POST https://user.laohu.com/openApi/sms/new/login`（手机号 + 短信验证码，老虎账号）
- 用户中心：`POST https://bbs-api.tajiduo.com/usercenter/api/login`
- 刷新：`POST https://bbs-api.tajiduo.com/usercenter/api/refreshToken`
- 抽卡：`GET https://bbs-api.tajiduo.com/apihub/awapi/yh/gacha`

请求需要 `authorization`、`uid`、`deviceid`、`appversion=1.2.5`、`ds` 签名（MD5(时间戳 + 随机串 + 版本 + 盐)）。登录和抽卡接口的签名规则来自社区开源实现 `NTEUID` / `NTE-Auto-Sign`。

### 返回与限制

`/apihub/awapi/yh/gacha` 返回：

- `roleid` / `rolename`
- `gachaDetails[]`：`tab`（限定卡池 / 常驻卡池 / 弧盘池）、`drawCount`、`rareCount`、`details[]`
- `details[]`：`charid`（角色数字 ID 或 `fork_*` 弧盘 ID）、`rareCount`（本次出 S 的抽数）、`timeStamp`（毫秒）

只返回已出 S 的明细，不返回 A/B 级逐条记录；`drawCount` 是各次 S 的 `rareCount` 之和，只覆盖“已出 S 的区间”，**不是账号完整总抽数，也不包含当前未出 S 的垫抽**。因此本软件只保存 S 级 + S 区间抽数，界面显示“已覆盖抽数”，当前垫抽显示为未知。

限制：

- 官方记录约保留 **180 天**，需要定期同步。
- 目前只有国服能与塔吉多绑定；B 服 / 国际服暂不支持。
- 角色名通过 `/apihub/awapi/yh/roleHome` 的已拥有角色列表和 `/apihub/awapi/yh/characters` 的已装备弧盘映射；未映射时回退显示 ID。
- 官方没有返回“本次 S 是否为 UP”的字段；本软件用常驻 S 名单判定：限定池中常驻 S（九原 / 早雾 / 白藏 / 达芙蒂尔 / 法帝娅 / 哈索尔）记为歪，其余 S 记为 UP。命中率按已判定的 S 数计算，不把武器池/常驻池算进分母。
- 短信登录是账号敏感操作；本软件只保存加密后的 `refreshToken`，不保存手机号和验证码，且必须先发送验证码才能登录。
- 推荐优先使用 **NTEUID JSON 导入** 兜底（见下节），不要把短信登录当作唯一数据源。

### 完整抽卡记录补充

塔吉多接口只有 S 区间，但游戏内抽卡页本身有完整流水。数据录入提供「导入 NTE 导出」：

- 使用 NTE Gacha Exporter（pktmon/WinDivert 抓包或自动翻页）导出 `nte-gacha-export` JSON。
- 导入后按完整流水计算总抽数、各池抽数和 S 垫抽；本地仍只保存 S 级。
- 这是目前拿到异环**完整总抽数**的方式；塔吉多官方同步仍标为“已覆盖抽数”。

### 已验证 / 未验证

- 已验证：未登录访问抽卡接口返回 HTTP 402；签名、登录、抽卡端点为社区工具在 2026 年使用的实现。
- 未验证：真实手机号短信登录需要用户本人操作；首次接入建议先用小号或确认账号安全后再使用。

### NTEUID 兜底格式

NTEUID 是异环社区通用的抽卡存档格式（`NTEUID/nte_gacha/README.md`）：

```json
{
  "format": "nteuid-gacha",
  "version": 1,
  "uid": "123456789012",
  "pools": {
    "limited": { "records": [{ "item_id": "1039", "time_ms": 1787317673012, "pity": 1 }] },
    "permanent": { "records": [] },
    "weapon": { "records": [] }
  }
}
```

本软件导入后生成稳定的 `nteuid_<uid>_<pool>_<item>_<time>_<pity>` 记录 ID，重复导入不会重复计数；只包含 S 级和 S 区间抽数，不含当前垫抽。导入入口：`数据录入 → 导入 NTEUID`（异环）。

## 4. 本软件的接入实现

### 服务端

- `src/api/thirdparty.js`
  - 森空岛扫码、绑定角色、明日方舟 / 终末地同步
  - 终末地日志链接提取、URL 解析、直接同步
  - 塔吉多短信登录、token 刷新、异环同步
- `src/api/nteuid.js`
  - NTEUID JSON 存档导入（异环长期归档兜底）
- `src/server.js`
  - `GET /api/thirdparty/status`
  - `POST /api/thirdparty/skland/qr`、`GET /api/thirdparty/skland/qr/:id`
  - `POST /api/thirdparty/skland/logout`、`GET /api/thirdparty/skland/bindings`
  - `POST /api/thirdparty/sync`（`game=arknights|endfield|nte`）
  - `POST /api/thirdparty/endfield/scan`、`/parse`、`/sync`
  - `POST /api/thirdparty/tajiduo/captcha`、`/login`、`/logout`
  - `POST /api/import/nteuid`（NTEUID 存档导入）

### 存储

- 继续使用 `data/app.json` 的 `accounts.<game>`。
- 新增 `poolNames`，用于保存官方卡池类别名。
- 鹰角登录态：`data/hypergryph-session.dat`，Windows DPAPI 加密。
- 塔吉多登录态：`data/tajiduo-session.dat`，Windows DPAPI 加密。
- 抽卡凭据（`u8_token`、accessToken）不写日志、不在接口响应中返回。

### 界面

- 第三方同步收进每个游戏的「数据录入 → 官方同步」页卡，不再单独占侧边栏；右上角账号入口负责游戏账号列表和登录。
- 数据录入页卡：官方同步、截图 OCR、历史汇总、手动添加；终末地额外有「粘贴链接」，异环额外有「NTEUID」。
- 官方同步：明日方舟/终末地复用森空岛绑定和同步；异环复用塔吉多登录和同步；登录仍由右上角账号入口负责。
- 截图录入、手动/Excel、分享等页面复用现有结构；显示“六星”/“S级”而非“五星”。
- 小黑盒导入：明日方舟数据录入提供「导入小黑盒」，读取小黑盒 JSON 的完整寻访序列，写入六星、时间、卡池，并按完整序列计算六星垫抽；低星不落库，只用于统计总抽数。终末地/异环没有公开的小黑盒文件格式，分别使用链接和 NTEUID。
- UP / 歪：`src/data/banners.json` 保存当前卡池（截止 2026-11-19）的 UP 名单，`src/data/catalog-*.json` 保存当前图鉴；`inferBannerUp()` 按记录时间、卡池类型和名称匹配，命中 UP 为 win，其余最高稀有度为 loss。未命中卡池表时保留未知，不强行判定。
- 卡池表更新：新卡池只需追加 banner（name/type/start/end/up/sixStars），不需要改代码。

## 5. 风险与后续

1. **明日方舟**：新接口需要网页登录态 + 两类 token，任何一端点变更都会导致同步失败；失败时保留本地记录并提示重新扫码。
2. **终末地**：链接来自游戏日志，必须先在游戏内打开一次寻访记录；国际服需要 `gryphline` 域名和对应 server_id。
3. **异环**：塔吉多登录是账号级敏感操作，且官方只保留约 180 天；建议先作为实验性功能，默认不自动登录，必须用户主动点击发送验证码。
4. **版本表 / 图鉴**：三款游戏暂未接入版本时间表和完整图鉴；手动录入时可留空版本，后续可按需补充。
5. **UP 判定**：明日方舟官方不返回 UP 信息；异环按常驻 S 名单判定（常驻 S 为歪，其余限定 S 为 UP）；终末地按卡池元数据判定。异环官方没有完整总抽数，只有已覆盖区间。

## 6. 参考

- Arkntools 明日方舟寻访导出：https://github.com/arkntools/arknights-gacha-export
- nonebot-plugin-skland / AstrBot 森空岛插件：https://github.com/qihang518887/astrbot_plugin_sklandv2
- 终末地抽卡工具：https://github.com/bhaoo/endfield-gacha
- Skport / Gryphline API 文档：https://github.com/AixLnyt/skport-api-docs
- 异环抽卡存档模型：https://github.com/tyql688/nteuid
- 异环自动签到 / 塔吉多登录实现：https://github.com/Candy-QAQ/NTE-Auto-Sign
- 终末地链接提取脚本：https://github.com/holstonline/endfield-gacha-url

> 以上第三方项目仅作为协议参考；本软件不复制其代码、图标或素材，接口可能随游戏版本变化。
