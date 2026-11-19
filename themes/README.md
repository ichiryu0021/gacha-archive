# 二游档案 · 主题目录

这里是「二游档案」全部主题的归类目录。主题实现、主题清单、注册表、接口标准放在同一处，避免主题资源散落在应用源码里。

## 目录

| 主题 | ID | 模式 | 目录 | 资源 |
| --- | --- | --- | --- | --- |
| 机能 · 黑 | `mecha` | `package` | [`mecha/`](mecha/README.md) | `mecha/theme.css` |
| 机能 · 白 | `light` | `variant`（继承 `mecha`） | [`light/`](light/README.md) | 复用 `mecha/theme.css`，只切换 `data-mecha-variant` |
| 经典 | `classic` | `builtin` | [`classic/`](classic/README.md) | 原版 `public/styles.css`，不加载主题视觉覆盖 |

- [`registry.json`](registry.json)：主题注册表，运行时和工具读取的主题索引。
- [`THEME-INTERFACE.md`](THEME-INTERFACE.md)：**主题接口标准 v1.0**，新增主题前先读。
- [`schema/`](schema/)：主题清单和注册表的 JSON Schema。
- [`validate.mjs`](validate.mjs)：不依赖第三方包的清单校验器。

## 快速校验

```powershell
cd D:\Project\二游档案
node themes\validate.mjs
```

期望输出：

```text
主题清单校验通过：3 个主题，默认 mecha
```

## 快速预览

```powershell
# 独立主题入口（演示数据，不动正式 data/）
node themes/mecha/server.mjs --demo
```

打开 `http://127.0.0.1:8791`，主题切换在「设置 → 界面主题」卡片里；顶栏不再放主题选择器。

## 目录约定

```text
themes/
├─ README.md                 # 本文件：主题索引
├─ THEME-INTERFACE.md        # 主题接口标准
├─ registry.json             # 主题注册表（默认值 / 排序）
├─ schema/
│  ├─ theme.schema.json      # theme.json 规范
│  └─ registry.schema.json   # registry.json 规范
├─ validate.mjs              # 清单校验器
├─ runtime/
│  └─ theme-loader.js        # 动态加载器（JSON 目录、CSS/JS、设置卡、映射）
├─ mecha/                    # 机能系列实现（package）
│  ├─ theme.json
│  ├─ theme.css
│  ├─ server.mjs
│  ├─ README.md / DESIGN.md
│  └─ screenshots/
├─ light/                    # 机能 · 白（variant）
│  └─ theme.json
└─ classic/                  # 经典（builtin）
   └─ theme.json
```

主题文件夹是**自动发现**的：只要 `themes/<id>/theme.json` 存在并且清单合法，打包版和独立入口都会在刷新后识别，不需要先改 `registry.json`。`registry.json` 现在只负责默认主题和排序。

## 主题实现原则

1. **主题是独立接口**：不修改 `public/index.html`、`src/`；只通过构建期注入或独立主题入口挂载 CSS/JS。
2. **主题选择只在设置页**：不占用顶栏；主题卡由动态加载器生成。
3. **支持按游戏指定主题**：设置页可选「全局默认 + 每个游戏覆盖」；切换游戏自动应用对应主题。
4. **经典模式不受影响**：`data-theme="classic"` 时不加载主题视觉覆盖，只保留设置页主题卡。
5. **字号与经典一致**：主题只改字体、字重、字距、颜色与材质；不擅自放大/缩小正文和数字。
6. **状态可持久化**：打包内置用 `ga_theme` + `ga_theme_games` Cookie；独立入口用 `/__theme/api/state|theme`。
7. **可降级**：`prefers-reduced-motion: reduce` 下动画直接落终态。

完整接口、属性、API、清单字段和验收清单见 [THEME-INTERFACE.md](THEME-INTERFACE.md)。
