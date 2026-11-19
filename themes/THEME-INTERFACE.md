# 二游档案 · 主题接口标准 v1.0

本文是「二游档案」主题包的接口契约。它定义主题目录、清单、状态属性、CSS / JS 边界、独立入口、打包注入、持久化和验收方式。

> 目标：主题是一个**独立接口**。新增/修改主题不需要改原应用的页面结构、业务逻辑和 `src/`；只通过 CSS / JS、构建期注入或独立主题代理接入。

---

## 1. 范围与非目标

### 1.1 本版本覆盖

- 主题目录归类：`themes/`。
- 主题清单：`theme.json`。
- 主题注册表：`registry.json`。
- 主题状态：`mecha` / `light` / `classic`。
- 根属性、首屏引导、CSS / JS 作用域。
- 设置页主题卡（唯一主题入口）。
- 打包内置 Cookie 持久化。
- 独立入口 `/__theme/api/state|theme` 持久化。
- 动效与 `prefers-reduced-motion` 降级。
- 验收命令和清单校验。

### 1.2 非目标

- 不定义主题之间的视觉风格；只定义接入契约。
- 不改变原应用的 API、数据库和业务行为。
- 不要求主题使用某个 CSS 框架。
- 不负责分享 JPG / canvas 的配色；分享图仍走原应用绘制器。

---

## 2. 目录结构

```text
themes/
├─ README.md                 # 主题索引
├─ THEME-INTERFACE.md        # 本文件：接口标准
├─ registry.json             # 主题注册表
├─ schema/
│  ├─ theme.schema.json      # theme.json 规范
│  └─ registry.schema.json   # registry.json 规范
├─ validate.mjs              # 清单校验器
├─ mecha/                    # package：机能 · 黑 + 共享引擎
│  ├─ theme.json
│  ├─ public/
│  │  ├─ theme.css
│  │  └─ theme.js
│  ├─ server.mjs
│  ├─ start.cmd
│  ├─ README.md
│  ├─ DESIGN.md
│  └─ screenshots/
├─ light/                    # variant：继承 mecha，只切 variant
│  ├─ theme.json
│  └─ README.md
└─ classic/                  # builtin：原版
   ├─ theme.json
   └─ README.md
```

约束：

- 一个主题一个目录，目录名使用小写字母、数字、短横线。
- 主题目录必须有 `theme.json`。
- `package` 主题必须有 CSS / JS 资源；`variant` 主题复用 `extends` 指向的 package；`builtin` 不加载主题 CSS。
- 截图、设计稿、独立入口等可选文件放在主题目录内部，不散落到应用源码。
- 主题运行时资源默认放在 `public/`，便于构建脚本复制。

---

## 3. 主题身份与变体

### 3.1 ID

主题 ID 使用小写 kebab-case，例如 `mecha`、`light`、`classic`。ID 同时用于：

- `registry.json` 的 `id`；
- `theme.json` 的 `id`；
- 设置页主题卡的 `data-theme`；
- 根属性 `data-theme` 或 variant 解析；
- Cookie `ga_theme`；
- 独立接口 `/__theme/api/theme` 的 `theme`。

### 3.2 三种模式

| mode | 含义 | 资源 | 运行时根属性 |
| --- | --- | --- | --- |
| `package` | 自带完整 CSS / JS 的主题包 | 本目录 `assets.css/js` | `data-theme="<id>"` |
| `variant` | 复用另一个 package 的 CSS / JS，只切换变体属性 | 继承 `extends`；不声明 assets | `data-theme="<extends>"` + `data-mecha-variant="<variant>"` |
| `builtin` | 原版界面，不加载主题视觉覆盖 | 无 | `data-theme="classic"`，不写 variant |

### 3.3 当前参考实现

| 主题 | ID | mode | 根属性 |
| --- | --- | --- | --- |
| 机能 · 黑 | `mecha` | `package` | `data-theme="mecha"` + `data-mecha-variant="dark"` |
| 机能 · 白 | `light` | `variant`（extends `mecha`） | `data-theme="mecha"` + `data-mecha-variant="light"` |
| 经典 | `classic` | `builtin` | `data-theme="classic"` |

> 注意：`light` 的 `data-theme` 仍然是 `mecha`，浅色覆盖使用双属性选择器：
> `html[data-theme="mecha"][data-mecha-variant="light"]`。
> 不要把浅色写成独立的 `data-theme="light"`，否则所有暗色共享结构会失配。

---

## 4. 主题清单 `theme.json`

每个主题目录必须有一个 `theme.json`。完整字段如下：

```json
{
  "$schema": "../schema/theme.schema.json",
  "interfaceVersion": "1.0",
  "id": "mecha",
  "name": "机能 · 黑",
  "en": "MECHANICAL / DARK",
  "version": "2.0.0",
  "description": "工业仪表 / 全直角 / 黄色主字 / 游戏机体色小装饰。",
  "mode": "package",
  "variant": "dark",
  "assets": {
    "css": "public/theme.css",
    "js": "public/theme.js"
  },
  "preview": "mecha/screenshots/dashboard.png",
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
| `interfaceVersion` | 是 | 当前固定 `"1.0"` |
| `id` | 是 | 小写 kebab-case，与目录/注册表一致 |
| `name` | 是 | 中文显示名 |
| `en` | 是 | 英文副题，显示在主题卡 |
| `version` | 是 | 语义化版本，例如 `2.0.0` |
| `description` | 否 | 主题卡说明 |
| `mode` | 是 | `package` / `variant` / `builtin` |
| `extends` | variant 必填 | 被继承的 package ID |
| `variant` | 是 | `dark` / `light` / `classic` |
| `assets.css/js` | package 必填 | 相对主题目录的路径 |
| `preview` | 否 | 相对 **themes 根目录** 的预览图 |
| `capabilities` | 是 | 能力声明；所有键必须是布尔值 |

能力声明：

| 键 | 含义 |
| --- | --- |
| `settingsCard` | 在设置页注入主题卡 |
| `cookie` | 支持 `ga_theme` Cookie |
| `standaloneApi` | 支持 `/__theme/api/*` |
| `animations` | 启用主题动效 |
| `reducedMotion` | 支持 reduced-motion 降级 |
| `embeddedBuild` | 可被 `npm.cmd run pack` 打包内置 |

Schema：[`schema/theme.schema.json`](schema/theme.schema.json)。  
校验器：[`validate.mjs`](validate.mjs)。

---

## 5. 主题注册表 `registry.json`

`registry.json` 是主题目录的**索引**，不是第二份完整清单。它只保存 ID 和目录名，完整信息在各自的 `theme.json`。

```json
{
  "$schema": "./schema/registry.schema.json",
  "interfaceVersion": "1.0",
  "defaultTheme": "mecha",
  "themes": [
    { "id": "mecha", "directory": "mecha" },
    { "id": "light", "directory": "light" },
    { "id": "classic", "directory": "classic" }
  ]
}
```

约束：

- `defaultTheme` 必须出现在 `themes` 中。
- `themes[].id` 必须与对应 `theme.json` 的 `id` 一致。
- ID 和目录都不能重复。
- `directory` 必须是小写 kebab-case，禁止路径分隔符。
- 新增主题时，先加目录和 `theme.json`，再登记到这里。

Schema：[`schema/registry.schema.json`](schema/registry.schema.json)。

---

## 6. 运行时 HTML 契约

### 6.1 根属性

主题状态体现在 `<html>`：

| 状态 | 属性 |
| --- | --- |
| 机能 · 黑 | `data-theme="mecha"`、`data-mecha-variant="dark"` |
| 机能 · 白 | `data-theme="mecha"`、`data-mecha-variant="light"` |
| 经典 | `data-theme="classic"`，无 `data-mecha-variant` |

打包内置额外写：`data-mecha-embedded="1"`；独立入口不写，改用 `data-mecha-theme="1"` 表示走主题 API。

> `data-theme` 与 `data-mecha-variant` 必须在主题 CSS 加载前写好，避免首屏闪烁。

### 6.2 首屏顺序

1. HTML 解析到 `<head>`。
2. 内联 boot 读取持久化状态（Cookie 或服务端注入）。
3. 设置根属性 `data-theme` / `data-mecha-variant` / `data-mecha-embedded`。
4. 加载主题 CSS。
5. 页面 body 末尾加载主题 JS。
6. 主题 JS 注入设置页主题卡；不注入顶栏选择器。

### 6.3 主题切换

`applyTheme(theme)` 时必须：

1. 校验 ID；
2. 更新根属性（经典时删除 variant）；
3. 更新 `meta[name="theme-color"]`；
4. 更新设置页主题卡的 `is-active` / `aria-pressed`；
5. 派发 `window` 事件 `mecha-theme-change`，`detail.theme` 为新主题 ID；
6. 触发动画重播（如启用）。

---

## 7. 持久化与 API 契约

### 7.1 打包内置：Cookie

- Cookie 名：`ga_theme`
- 允许值：`classic` / `mecha` / `light`
- 路径：`/`
- 有效期：1 年
- Cookie 按 `127.0.0.1` 记录，与 Electron 随机端口无关
- 位置随 Electron 的 `data/electron/` 保留
- 首屏 boot 的正则必须同时接受三个值：
  `ga_theme=(classic|mecha|light)`
- 默认值：`mecha`

### 7.2 独立入口：主题 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/__theme/api/state` | 返回当前主题、默认主题、主题列表 |
| `POST` | `/__theme/api/theme` | body：`{"theme":"mecha|light|classic"}` |

- 非法主题返回 `400`（例如 `pink`）。
- 状态写入 `themes/mecha/.theme-state.json`，使用临时文件 + rename 原子替换。
- `GET /__theme/api/state` 返回结构至少包含：

```json
{
  "ok": true,
  "theme": "mecha",
  "defaultTheme": "mecha",
  "themes": [
    { "id": "mecha", "name": "机能 · 黑", "en": "MECHANICAL / DARK" },
    { "id": "light", "name": "机能 · 白", "en": "MECHANICAL / PAPER" },
    { "id": "classic", "name": "经典", "en": "CLASSIC" }
  ]
}
```

### 7.3 独立入口 HTML 注入

服务端在返回原应用 HTML 时：

- 清理已有的 `data-theme` / `data-mecha-variant`；
- 写入当前主题对应的根属性；
- 注入 `<link rel="stylesheet" href="/__theme/theme.css">`；
- 注入 `<script src="/__theme/theme.js"></script>`；
- 设置 `data-mecha-theme="1"`，主题 JS 据此走 API 而不是 Cookie。

### 7.4 打包内置注入

`scripts/pack.cjs` 在打包后的 `index.html` 中：

- 注入 Cookie boot；
- 注入 `/theme-mecha.css?h=<sha10>`；
- 注入 `/theme-mecha.js?h=<sha10>`；
- 不修改原项目 `public/index.html`、`src/`；
- 只复制 `themes/mecha/public/theme.css|theme.js`，主题目录的其它内容不进程序目录。

---

## 8. CSS 契约

### 8.1 作用域

- 视觉规则必须以 `html[data-theme="mecha"]` 等根属性为前缀。
- 经典模式不加载主题 CSS 规则。
- 浅色变体使用双属性前缀：
  `html[data-theme="mecha"][data-mecha-variant="light"]`。
- 不得改写原应用的全局布局选择器而不加前缀。

### 8.2 允许改什么

- 颜色、背景、边框、阴影、纹理、字体家族、字重、字距。
- 组件外观、装饰、卡片角标、图表/进度条颜色。
- 动画与过渡（遵循第 10 节）。

### 8.3 不应改什么

- **不修改应用字号**：v1.0 要求主题字号与经典一致；实测基准：h1 38 / Hero 82 / 卡片标题 15.5 / 统计 27 / 导航 15.5 / 页签 14.5 / 表头 10.5px。
- 不新增/删除应用 DOM 结构，不包裹业务节点。
- 不覆盖应用的内联 `width / height / left / --p` 等运行期样式（动画除外，见第 10 节）。
- 不使用 `backdrop-filter` 之类会改变原应用层级的大面积效果，除非主题自行承担兼容性。

### 8.4 字体

- 主题可以改 `font-family`、`font-weight`、`letter-spacing`。
- 字号继承原应用；不得用 `font-size` 放大/缩小正文、数字、卡片标题和表格。

### 8.5 可访问性

- 正文/标签对比度满足可读性；浅色技术标签不使用过淡的灰色。
- 颜色不是唯一信息；UP/歪、垫抽过高等仍需文字标签。
- `prefers-reduced-motion: reduce` 下显式关闭动画，直接落终态。
- 输入框、表格密集数字不加白字阴影。

---

## 9. JS 契约

主题 JS 是独立 IIFE，不导入应用模块，不修改 `public/app.js`。

必须：

- 读取根属性决定当前主题；
- 注入设置页主题卡；
- 处理主题卡点击、保存状态、失败回滚；
- 监听 `#view` 的 `childList` 重新挂载设置卡；
- 更新 `meta[name="theme-color"]`；
- 派发 `mecha-theme-change`；
- 在经典模式不播放主题动画；
- 不使用 `{ subtree: true }` 观察 `#view`（避免自触发）；
- 数字动画写 `firstChild.nodeValue`，不覆盖 `<small>` 单位；
- 只在 `document.hidden` / reduced-motion 时降级，不留下半截数字。

禁止：

- 全局变量污染（除主题事件）；
- 修改原应用业务数据、请求、分享 canvas；
- 改写 `#view.innerHTML`；
- 拦截原应用点击/路由。

### 9.1 设置页主题卡

唯一主题入口是设置页卡片，选择器约定：

- 容器：`.ga-settings-theme`
- 选项：`.ga-set-choice[data-theme="<id>"]`
- 文案：`.ga-set-copy strong/small/em`
- 选中：`.is-active` + `aria-pressed="true"`
- 保存提示：`.ga-theme-note`
- 保存中：容器 `data-saving="1"`

顶栏不再注入主题按钮 / 弹出面板。

### 9.2 主题事件

```js
window.dispatchEvent(new CustomEvent('mecha-theme-change', {
  detail: { theme: 'mecha' },
}));
```

监听方可以据此重播动画、更新外部 UI；事件不冒泡依赖。

---

## 10. 动效契约

- 只使用 `transform` / `scale` / `rotate` / `opacity` / `clip-path` 等合成友好属性。
- 不使用 `filter` 做持续条动画。
- 入场动画只绑定 `.view.mecha-in`；每次视图重渲染后重新挂载。
- 环旋转/呼吸可以持续；条/数字/卡片入场应一次性。
- 数字计数：
  - 缓动尾段要放慢（参考 1080ms + easeOutQuart）；
  - 结束写回原始字符串；
  - 不碰 `<small>` 单位；
  - 支持 `force` 重播，但要取消旧 rAF / token；
  - 主题切换 / reduced-motion 时落终态。
- `prefers-reduced-motion: reduce`：
  - 不挂 `.mecha-in`；
  - `animation: none`；
  - 数字直接写终值；
  - 弧线直接写目标值。

---

## 11. 独立入口与打包

### 11.1 独立入口

```powershell
node themes/mecha/server.mjs --demo
```

- 入口代理原服务，运行时注入根属性和主题资源；
- 状态由 `.theme-state.json` 保存；
- 不得写正式 `data/`（使用 `--demo` 时读 `demo-data/`）。

### 11.2 打包内置

```powershell
npm.cmd run pack
```

- 输出固定：`dist\二游档案`；
- 保留 `dist\二游档案\data`；
- 主题资源复制到 `resources/app/public/`；
- 首屏 boot 注入，Cookie 持久化；
- 主题目录的截图、独立入口、文档不进程序目录。

---

## 12. 版本与兼容

- 当前接口版本：`1.0`。
- 清单/注册表变更应提升 `interfaceVersion`，并同步 schema/校验器。
- 主题 ID 一旦发布，不建议重命名；重命名需要迁移 Cookie、状态文件和设置页选中态。
- `variant` 主题必须引用一个存在的 `package`；`builtin` 不声明 assets。

### 12.1 参考实现限制

v1.0 的主题清单和注册表是**归类与校验的权威目录**，但参考运行时的主题 ID 列表仍由以下位置显式维护：

- `themes/mecha/public/theme.js` 的 `THEMES` / `isTheme` / Cookie 读取；
- `themes/mecha/server.mjs` 的 `THEMES` / `normalizeTheme` / `themeAttrs`；
- `scripts/pack.cjs` 的 Cookie boot 正则和默认主题。

因此新增一个**全新 ID**（不是现有黑/白/经典变体）时，除了主题目录和注册表，还需要同步这三处运行时列表；未来可改为从 `registry.json` 动态加载。新增一个**同引擎 variant**（例如机能·灰）时，只需新增 variant 清单、在运行时列表加 ID、补充 variant 属性解析。

---

## 13. 新增主题步骤

1. 在 `themes/` 下新建目录（小写 kebab-case）。
2. 写 `theme.json`：
   - `package`：准备 `public/theme.css` + `theme.js`，声明 assets。
   - `variant`：声明 `extends` 和 `variant`，不复制完整 CSS。
   - `builtin`：不声明 assets。
3. 在 `registry.json` 登记 `id` + `directory`。
4. 如果新 ID 不在运行时列表，同步：
   - `themes/mecha/public/theme.js`
   - `themes/mecha/server.mjs`
   - `scripts/pack.cjs`（boot 正则）
5. 运行 `node themes/validate.mjs`。
6. 运行 `node themes/mecha/server.mjs --demo` 做独立入口验收。
7. 运行 `npm.cmd run pack` 做打包内置验收。
8. 更新 `themes/README.md` 索引和主题截图。

---

## 14. 验收清单

- [ ] `node themes/validate.mjs` 输出「主题清单校验通过」。
- [ ] `registry.json` 的 `defaultTheme` 存在。
- [ ] 主题目录、`theme.json`、assets、preview 路径全部存在。
- [ ] 设置页主题卡三张可切换，选中态和 `aria-pressed` 正确。
- [ ] 顶栏没有主题选择器。
- [ ] 黑色/白色字号与经典逐项一致。
- [ ] 白色主题根属性是 `data-theme="mecha"` + `data-mecha-variant="light"`。
- [ ] 经典根属性是 `data-theme="classic"`，且没有主题动画类。
- [ ] 打包内置 Cookie `ga_theme` 刷新/重启沿用。
- [ ] 独立入口 `GET/POST /__theme/api/*` 正常，非法主题 400。
- [ ] reduced-motion 下无动画、数字/弧线直接终态。
- [ ] 分享 JPG、OCR、同步、导出回归正常。
- [ ] 原项目测试 `npm.cmd test` 通过。
- [ ] 用户 `data/app.json` 构建前后 hash 不变。

---

## 15. 参考实现

- 主题索引：[`README.md`](README.md)
- 机能包：[`mecha/README.md`](mecha/README.md)
- 设计语言：[`mecha/DESIGN.md`](mecha/DESIGN.md)
- 清单 schema：[`schema/theme.schema.json`](schema/theme.schema.json)
- 注册表 schema：[`schema/registry.schema.json`](schema/registry.schema.json)
- 校验器：[`validate.mjs`](validate.mjs)
