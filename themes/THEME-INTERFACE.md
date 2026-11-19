# 二游档案 · 主题接口标准 v1.0

本文定义主题目录、清单、动态加载、状态持久化、按游戏映射、CSS / JS 边界和验收方式。

> 主题是一个独立接口：主题文件夹放进 `themes/`，刷新后由运行时扫描并加载。不需要修改应用页面结构或业务逻辑。

---

## 1. 目录规范

```text
themes/
├─ README.md
├─ THEME-INTERFACE.md
├─ registry.json              # 可选：默认主题 + 排序
├─ schema/
├─ validate.mjs
├─ runtime/
│  └─ theme-loader.js         # 固定运行时，不属于某个主题
├─ mecha/
│  ├─ theme.json
│  ├─ theme.css
│  ├─ theme.js                # 可选
│  ├─ README.md / DESIGN.md
│  ├─ server.mjs
│  └─ screenshots/
├─ light/
│  └─ theme.json              # variant，复用 mecha/theme.css
└─ classic/
   └─ theme.json              # builtin，无主题 CSS
```

主题目录规则：

- 一个主题一个目录，目录名使用小写 kebab-case。
- 目录必须有 `theme.json`；`id` 必须和目录名一致。
- `package` 主题必须有 `theme.css`；`theme.js` 可选。
- `variant` 主题通过 `extends` 复用 package 的 CSS，不复制完整样式。
- `builtin` 主题不加载主题 CSS（classic 使用原版样式）。
- 主题文件夹**自动发现**：运行时扫描 `themes/<id>/theme.json`，不要求先登记 registry。
- `runtime/`、`schema/`、`node_modules/` 和隐藏目录不会被当作主题。

---

## 2. 主题清单 `theme.json`

```json
{
  "$schema": "../schema/theme.schema.json",
  "interfaceVersion": "1.0",
  "id": "mecha",
  "name": "机能 · 黑",
  "en": "MECHANICAL / DARK",
  "version": "2.02",
  "description": "工业仪表 / 全直角 / 黄色主字。",
  "mode": "package",
  "variant": "dark",
  "assets": {
    "css": "theme.css",
    "js": ""
  },
  "capabilities": {
    "settingsCard": true,
    "cookie": true,
    "standaloneApi": true,
    "animations": true,
    "reducedMotion": true,
    "embeddedBuild": true
  }
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `interfaceVersion` | 是 | 当前 `1.0` |
| `id` | 是 | 小写 kebab-case，必须等于目录名 |
| `name` / `en` | 是 | 主题卡显示名 / 英文副题 |
| `version` | 是 | X.XX 格式，例如 `2.02` |
| `description` | 否 | 主题卡说明 |
| `mode` | 是 | `package` / `variant` / `builtin` |
| `extends` | variant 必填 | 被继承的 package ID |
| `variant` | 是 | `dark` / `light` / `classic` |
| `assets.css` | package 必填 | 相对主题目录的 CSS 路径 |
| `assets.js` | 否 | 可选的附加脚本 |
| `capabilities` | 是 | 能力声明，布尔值 |

`assets.js` 是可选的；动态加载器会把它作为普通脚本加载，不会把它当作核心加载器。

Schema：[`schema/theme.schema.json`](schema/theme.schema.json)。

---

## 3. 注册表与自动发现

`registry.json` 不再是主题白名单，只负责默认值、基础主题和排序：

```json
{
  "interfaceVersion": "1.0",
  "defaultTheme": "mecha",
  "themes": [
    { "id": "mecha", "directory": "mecha" },
    { "id": "light", "directory": "light" },
    { "id": "classic", "directory": "classic" }
  ]
}
```

- 运行时扫描所有含 `theme.json` 的目录。
- `registry.themes` 中列出的主题优先排序。
- 新目录即使没有写进 registry，也会被发现，排在已登记主题之后。
- `defaultTheme` 不存在时回退到 `mecha`，再回退到第一个合法主题。
- 目录名和 `theme.json.id` 不一致的目录会被忽略。

运行时目录 API：`GET /__theme/themes.json`。

---

## 4. 动态加载协议

### 4.1 固定运行时

`themes/runtime/theme-loader.js` 是唯一的主题加载器，负责：

1. 请求 `/__theme/themes.json`；
2. 校验当前/默认主题；
3. 设置 `<html>` 属性；
4. 加载活动主题的 CSS / 可选 JS；
5. 生成设置页主题卡；
6. 读取/保存状态；
7. 按游戏切换主题；
8. 触发主题事件和动画重播。

主题包不应再复制这个文件。

### 4.2 根属性

| 主题 | 根属性 |
| --- | --- |
| 机能 · 黑 | `data-theme="mecha"`、`data-mecha-variant="dark"` |
| 机能 · 白 | `data-theme="mecha"`、`data-mecha-variant="light"` |
| 经典 | `data-theme="classic"`，无 `data-mecha-variant` |
| 新 package | `data-theme="<id>"` |

`light` 仍然使用 `data-theme="mecha"`；浅色覆盖使用双属性选择器：

```css
html[data-theme="mecha"][data-mecha-variant="light"] { ... }
```

### 4.3 基础样式

- 打包内置：`/theme-base.css`，由 `scripts/pack.cjs` 从 `themes/mecha/theme.css` 复制。
- 独立入口：`/__theme/base.css`。
- 基础样式始终加载，包含主题卡 UI 和 mecha 结构；新主题的 CSS 在它之后加载。
- 这样 classic 也能保持主题卡样式，新主题也能覆盖基础外观。

### 4.4 自定义主题资源

- 活动 package（非 mecha）：
  `/__theme/files/<id>/<assets.css>`
- variant：加载 `extends` 指向的 package CSS；如果继承 mecha，则使用基础样式。
- 可选 JS：`/__theme/files/<id>/<assets.js>`。
- 加载器会移除上一个主题的资源，避免残留。

### 4.5 刷新识别

把主题文件夹放进 `themes/` 后，刷新页面即可在设置页看到。无需重启，也无需修改 registry。

---

## 5. 状态与按游戏映射

状态结构：

```json
{
  "theme": "mecha",
  "gameThemes": {
    "genshin": "classic",
    "hsr": "light"
  }
}
```

解析顺序：

```text
gameThemes[当前游戏] -> theme（全局默认） -> defaultTheme
```

切换游戏时，加载器监听 `body[data-game]`，自动应用对应主题。

### 5.1 打包内置

- `ga_theme`：全局默认主题
- `ga_theme_games`：URL 编码的 JSON 对象
- 两个 Cookie 都是 `Path=/`、1 年、`SameSite=Lax`
- 按 `127.0.0.1` 生效，与 Electron 随机端口无关

### 5.2 独立入口

`themes/mecha/.theme-state.json`：

```json
{
  "theme": "mecha",
  "gameThemes": {},
  "updatedAt": "2026-11-19T00:00:00.000Z"
}
```

`GET /__theme/api/state` 返回 `theme`、`gameThemes`、`defaultTheme`、`themes`。  
`POST /__theme/api/theme` 接受：

```json
{ "theme": "mecha", "gameThemes": { "genshin": "classic" } }
```

非法主题返回 `400`。

### 5.3 设置页 UI

唯一入口是设置页卡片，选择器：

- 全局主题卡：`.ga-settings-theme .ga-set-choice[data-theme]`
- 按游戏选择：`.ga-settings-theme [data-game-theme]`
- 当前游戏：`.ga-game-theme-row.is-current`
- 全跟随全局：`[data-action="game-themes-reset"]`

顶栏不注入主题选择器。

---

## 6. CSS 契约

必须：

- 以 `html[data-theme="<id>"]`（或 variant 双属性）限定视觉规则。
- 使用主题变量/自有命名，不覆盖 `public/app.js` 的 DOM 结构。
- 字号与经典一致；只改字体、字重、字距、颜色、材质和装饰。
- 支持 `prefers-reduced-motion`。
- 保证经典模式不加载主题视觉覆盖。

禁止：

- 修改 `#view.innerHTML` 或包裹业务节点。
- 用 `font-size` 放大/缩小正文、数字、卡片标题、表格。
- 覆盖应用运行期内联的 `width / height / left / --p`。
- 在全局选择器上写不带主题作用域的布局规则。

主题卡 UI 的基础样式在 `themes/mecha/theme.css` 顶部，由基础样式加载器提供。

---

## 7. JS 契约

主题包 JS 可选；固定加载器负责公共状态和 UI。主题 JS 如存在：

- 作为普通脚本加载，不导入应用模块；
- 不修改业务数据、请求、分享 canvas；
- 不自带主题卡/持久化逻辑（由 loader 负责）；
- 应自行处理重复加载/卸载。

固定加载器：

- 全局只挂 `window` 事件 `mecha-theme-change`；
- 只使用 `#view` 的 `childList` 观察设置页；
- 监听 `body[data-game]`；
- 不观察 `subtree/characterData`，避免自触发；
- 设置页卡重渲染后自动补回。

事件：

```js
window.dispatchEvent(new CustomEvent('mecha-theme-change', {
  detail: { theme: 'mecha', game: 'genshin' },
}));
```

---

## 8. 服务端接口

### 8.1 打包内置

`src/server.js` 增加只读主题路由：

- `GET /__theme/themes.json`：扫描根目录 `themes/` 并返回清单；
- `GET /__theme/files/<id>/<path>`：只读主题资源，限制在主题目录内；
- 静态 `/theme-base.css`、`/theme-loader.js` 由构建复制到 `resources/app/public/`。

打包根目录同时包含 `themes/`，用户可以直接放新主题文件夹。

### 8.2 独立入口

`themes/mecha/server.mjs`：

- 扫描 `themes/`；
- 注入根属性、`/__theme/base.css`、`/__theme/theme.js`；
- 提供 `/__theme/themes.json`、`/__theme/files/*`、`/__theme/api/state|theme`；
- 其它请求代理原服务。

---

## 9. 构建

`npm.cmd run pack`：

1. 打包 Electron 程序；
2. 复制 `themes/mecha/theme.css` 为 `resources/app/public/theme-base.css`；
3. 复制 `themes/runtime/theme-loader.js` 为 `resources/app/public/theme-loader.js`；
4. 注入基础样式和加载器脚本；
5. 复制完整 `themes/` 到程序根目录，排除 `.theme-state.json`；
6. 不把用户 `data/` 放进程序目录。

完整包会带主题文件夹；热更新包只替换 `resources/app`，不覆盖根目录 `themes/`。

---

## 10. 新增主题

1. 新建 `themes/<id>/`。
2. 写 `theme.json`，确保 `id` 等于目录名。
3. package：添加 `theme.css`（可选 `theme.js`）；variant：填写 `extends`；builtin：只写清单。
4. 可选：把 `<id>` 加进 `registry.json` 以控制默认/排序。
5. 刷新页面，在设置页查看主题卡和按游戏映射。
6. 运行 `node themes/validate.mjs`。
7. 如需固定默认，修改 registry 的 `defaultTheme`。

不需要改 `themes/runtime/theme-loader.js`，也不需要改 `public/app.js`。

---

## 11. 校验

```powershell
node themes/validate.mjs
```

校验内容：

- registry 结构；
- 每个含 `theme.json` 的目录（含未登记目录）；
- manifest ID 与目录名；
- package 的 CSS 和可选 JS；
- variant 的 extends 是否存在且为 package；
- 预览图路径；
- 默认主题存在。

Schema：[`schema/theme.schema.json`](schema/theme.schema.json)、[`schema/registry.schema.json`](schema/registry.schema.json)。

---

## 12. 验收清单

- [ ] `node themes/validate.mjs` 通过。
- [ ] 新主题文件夹放入 `themes/` 后刷新即出现在设置页。
- [ ] 设置页 3+ 张主题卡、8 个游戏映射下拉。
- [ ] 切换游戏自动应用对应主题。
- [ ] 刷新后全局主题和游戏映射保留。
- [ ] 经典模式不加载主题视觉覆盖。
- [ ] 黑/白字号与经典一致。
- [ ] 新主题 CSS 真正加载并生效。
- [ ] 顶栏无主题选择器。
- [ ] reduced-motion 下降级。
- [ ] 原项目测试通过。
- [ ] 构建前后用户数据 hash 不变。
