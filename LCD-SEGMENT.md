# 57 段数码管 · 呈现方案（封存 v1.0）

> **状态：已封存**（2026-11-28）。`dist/lcd-segment-kit/` 与 `dist/lcd-segment-kit.zip` 视为基线，不再改动。
> 之后所有相关实现、修正、二次开发都**以这份方案为准**。
> `editor.html` 是封存内容的一部分，作为演示与段位校对工具保留，**不删除**。

---

## 1. 这份方案是什么 / 不是什么

**是**：一套「57 段数码管」的纯矢量呈现方案 —— 每个数字格由 57 条段路径组成，点亮其中若干条就是一个字符；
没点亮的段按底纹色画，天然构成「未显示部分的框架」。

**不是**：不含计数动画、不含业务逻辑、不依赖框架、**不加载任何字体文件**。
动画（例如「总抽数」的滚动与收尾逐个落定）属于应用层实现，见 §5。

几何来源：按通力（KONE）电梯 57 段数码管公开的分段样式**自行描摹**的矢量稿。
描摹原稿（`通力57段字体矢量图.svg`）由作者本地保留，**不入库**；入库的是
`public/lcd-segments.js` 里 57 条规范化后的段路径。早期曾用社区二创字体作为
「每个字符点亮哪些段」的参考，字体文件既未分发、也不再参与渲染。

---

## 2. 封存清单

目录：`dist/lcd-segment-kit/`　压缩包：`dist/lcd-segment-kit.zip`（203,767 字节）

| 文件 | 大小 | SHA-256 |
| --- | --- | --- |
| `lcd-segments.js` | 54,970 | `F5B4B5566734DC2957B7EEA224D07D359DFD8079F6C330DDF7F37DA280226F03` |
| `lcd-digits.js` | 5,489 | `F861E34AAAB88C31A79208CE24EBBA457CB34CB107F5905DAF4D38B71D4863E9` |
| `lcd-digits.css` | 2,356 | `F8EEF5AA571B23678634C572849FD2C71389B706933E8A40A4F7A0FF1CBDE97A` |
| `demo.html` | 6,701 | `6B2C47BAB2DE3C40E2C5348F96DDF084C8EFBBF45792CDA39CA91402899F492A` |
| `editor.html` | 11,681 | `8FAB846E48720DB26D82FF85AC606FEF2621E143969220BF513C46AE761B6628` |
| `README.md` | 6,256 | `2F5D143AC7FFDB965069451A8BCAA81B7CCADD53E8CE5715EB16C8191B3E1715` |
| `LICENSE-FONT.txt` | 800 | `9E4E0C3B9F99BF300D925EB61EDEFBC4B844E67AEEBF699C86388E82DB7B7318` |
| `preview.png` | 177,899 | `762122286894D455A64B4339E87B09F64146361A02FCD3A72063D0CEB25B5AD1` |

压缩包：`EEC30C96C379BD5B499093A2FD7C602E09FF3B26E2C69D1C46DCF2ECB1F07BBF`

**校验是否被改动**（在仓库根执行）：

```powershell
Get-ChildItem dist\lcd-segment-kit -File | ForEach-Object {
  "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash, $_.Name
}
```

哈希与上表不一致 = 封存内容被改过，按 §8 的流程处理。

---

## 3. 数据契约（`lcd-segments.js`）

```js
window.LCD_SEGMENTS = {
  viewBox: "0 0 2070 3227",
  ids:   ["w01", …, "g25"],        // 57 条段，顺序即绘制顺序
  paths: { "w01": "M…", … },       // 每段的闭合路径 d
  glyphs: { "0": ["w01", …], " ": [], … }   // 95 个字符 → 点亮的段
};
```

| 项 | 值 |
| --- | --- |
| 段总数 | 57（`w01–w32` 32 条 + `g01–g25` 25 条） |
| `w` / `g` 的含义 | **仅表示描摹时的分组**（原图的白 / 浅灰分段），不代表语义，可忽略 |
| 字符数 | 95 = `0-9`(10) + `A-Z`(26) + `a-z`(26) + 32 个标点 + 空格 |
| 标点集合 | `` ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { \| } ~ `` |
| 每字符段数 | 0（空格）～ 41（`B` / `M` / `0`），平均 24.3 |
| 视口 | `0 0 2070 3227`，一格的图形边界就是视口 |

**不可逆约束**（后续实现都依赖这些）：

1. 段 id **稳定**，不得重命名或重排；
2. `paths` 里的 `d` **不得修改**（改了就不是这套段样式了）；
3. `glyphs` 的键必须是单字符、值必须是上面 `ids` 的子集；
4. 空格是 `[]`（整格不亮）——它让「ERR 01」这类带空格的字符串也能走段位显示。

---

## 4. 运行时契约（`lcd-digits.js` + `lcd-digits.css`）

### 4.1 生成的 DOM

```html
<span class="lcd" style="--lcd-n:4" role="img" aria-label="4653">
  <span class="lcd-cells" aria-hidden="true">
    <svg class="lcd-cell" viewBox="0 0 2070 3227">
      <use href="#lcdseg-w01"/><use href="#lcdseg-w02"/>…（57 个）
    </svg>
    ×N
  </span>
  <span class="lcd-lit">4653</span>   <!-- 文本源：读屏 / 取值，视觉隐藏 -->
</span>
```

57 条段路径只在 `<defs>` 里插一次（id `lcdseg-<段id>`），每格用 `<use>` 引用，亮灭靠 `use.on`。

### 4.2 API

| 方法 | 说明 |
| --- | --- |
| `LCDDigits.mount(host, value)` | 在 host 里生成结构并点亮，返回 `.lcd` 根节点 |
| `LCDDigits.setValue(target, value)` | 改值；位数变化会重建格子，否则只更新变化的格 |
| `LCDDigits.sync(root)` / `syncAll()` | 手动把 `.lcd-lit` 文本同步到格子（自定义计数器时用） |
| `LCDDigits.watch()` | 监听 DOM 变化，文本被外部改动时自动同步 |
| `LCDDigits.write(value)` | 只取 HTML 字符串 |
| `LCDDigits.data` | 几何数据本身 |

### 4.3 颜色与尺寸（只认这些变量）

| 变量 | 作用 | 暗色参考 | 亮色参考 |
| --- | --- | --- | --- |
| `--lcd-size` | 字号（整块尺寸基准） | `clamp(112px, 15.6vw, 183px)` | 同 |
| `--lcd-lit` | 亮段颜色 | `#f2d35f` | `#2b312d` |
| `--lcd-ghost-color` | 未点亮段颜色 | `#e9c74a` | `#262b25` |
| `--lcd-ghost-alpha` | 未点亮段透明度 | `.1` | `.08` |
| `--lcd-glow` | 亮段辉光（`drop-shadow`） | `rgba(233,199,74,.3)` | `rgba(156,116,21,.16)` |

尺寸比例（描摹稿自带，不要按字体惯性去改）：单格 `.296em × .4615em`、格间距 `.0455em`、
步进 `.3415em`；`viewBox` 比例 3227 / 2070 决定了高度。

### 4.4 渲染规则

- **颜色只走 CSS 变量**，SVG 里不带 `fill`（`paths` 也没有填色信息）——换主题只改变量；
- 非 ASCII 字符（中文、`—`、全角标点）或超过 12 个字符的串：**整串**回退普通等宽字体，不做部分降级；
- 空格 = 空白格；连续空格就是连续空白格。

---

## 5. 在「二游档案」里的落地（参考实现，非封存内容）

| 位置 | 作用 |
| --- | --- |
| `public/lcd-segments.js` | 数据本体（与 kit 里同名文件内容一致） |
| `public/app.js` | `lcdNumber()` 生成结构、`lcdRenderable()` 判定可渲染、`syncLcd()` 逐位同步、`watchLcd()` 挂 MutationObserver 并启用 defs |
| `public/styles.css` | `.lcd` / `.lcd-cells` / `.lcd-cell` / `.lcd-seg-defs` / `.lcd-lit` 样式与 `--lcd-*` 默认值 |
| `themes/mecha/theme.css` | 暗 / 亮两套 `--lcd-*` 覆盖（`.lcd` 作用域内） |
| `themes/runtime/theme-loader.js` | **动画层**：`countNumbers()` 改 `.lcd-lit` 文本，双曲线减速 + 收尾逐格落定；不在方案内 |
| `public/index.html` | `<script src="/lcd-segments.js?v=…">`，改数据后记得 bump `?v=` |

应用侧的「总抽数」= `lcdNumber()` 输出；计数动画由主题 loader 驱动，`watchLcd()` 负责把文本逐位同步到格子。

---

## 6. 使用与验收

```html
<link rel="stylesheet" href="./lcd-digits.css">
<script src="./lcd-segments.js"></script>
<script src="./lcd-digits.js"></script>
<div class="lcd-slot"></div>
<script>LCDDigits.mount(document.querySelector('.lcd-slot'), '4653');</script>
```

- **看效果 / 试字符**：`demo.html`（暗、亮两套 + 自由输入框）
- **改某个字符点亮哪些段**：`editor.html` → 点字符 → 点格子里的段 → 导出 JSON
- **验收必须用 1x 截图**：2x 截图会掩盖段缝与对齐问题（这个方案在 1x 下才是真实观感）
- 字符表合法性可复用这段检查：`glyphs` 的键都是单字符、值都是 `ids` 子集、无空值（除空格）

---

## 7. 已知限制

1. `[` 与 `{`、`]` 与 `}` 段位完全相同（段码屏上本就近似），属已知简化；
2. 单串上限 12 格（`MAX_CHARS`），超过整串回退普通字体；
3. 非 ASCII（中文、`—`、全角标点）不在表里，**整串**回退；
4. 字号很小时段缝会弱化成灰线（这是段码屏的固有观感，不要用描边去“补”）；
5. 「KONE」为通力公司商标；本方案为非官方实现，与该品牌无隶属关系。

---

## 8. 变更流程（封存之后）

**日常不动 kit**。确需修改时按下面走，并回填本文件的「变更记录」：

1. 只允许改**字符表**（`glyphs`），不允许改段几何、段 id、渲染契约；
2. 改的位置与顺序：`public/lcd-segments.js` → 应用内验证（真实应用 1x 截图）→ 同步到
   `dist/lcd-segment-kit/lcd-segments.js` → 重打 `dist/lcd-segment-kit.zip` → bump
   `public/index.html` 的 `?v=` → 重打 `dist\二游档案`；
3. 重新封存时更新 §2 的哈希表，版本号 +0.1（v1.1、v1.2…），并在下面记一行。

### 变更记录

| 版本 | 日期 | 内容 |
| --- | --- | --- |
| v1.0 | 2026-11-28 | 首次封存，§2 的哈希即该版本。封存前已完成三项内容修订：① `8` 补 `g14`、`E` 去 `w07`；② 补齐空格（`" "` → `[]`）；③ 按编辑器导出校正 `F T Z [ ] ^ \` a c d r s z { }` 共 15 个字符的段位 |

> 封存后的修订请新增一行 v1.1 / v1.2…，并同步更新 §2 哈希表。

## 9. 来源与许可

- 段几何：按通力官网公开分段样式自行描摹，本项目二创数据（原稿本地保留，不入库）；
- 不包含、不加载任何第三方字体文件；早期曾用社区二创字体作字符段位参考，现已无关；
- 方案代码（`lcd-digits.css` / `lcd-digits.js` / `demo.html` / `editor.html`）可自由取用、修改；
- 详见 `THIRD_PARTY_NOTICES.md` 与 kit 内 `LICENSE-FONT.txt`。
