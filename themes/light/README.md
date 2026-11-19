# 机能 · 白

`light` 是 `mecha` 的 **variant** 主题，不单独复制一份 117KB 的 CSS。

- 运行时根属性：`data-theme="mecha"` + `data-mecha-variant="light"`。
- 资源：复用 [`../mecha/public/theme.css`](../mecha/public/theme.css) 和 [`theme.js`](../mecha/public/theme.js)。
- 主题卡预览、截图和颜色规则在 `mecha` 包内维护。
- 清单：[`theme.json`](theme.json)。

修改浅色覆盖时，编辑 `themes/mecha/public/theme.css` 的 `html[data-theme="mecha"][data-mecha-variant="light"]` 段，不要新建第二份完整主题。
