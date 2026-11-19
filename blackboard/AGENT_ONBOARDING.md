# 子代理入场说明

我们通过小黑板协作，写入权归 Lead。

## 开工

1. 读 `BLACKBOARD.md`。
2. 读 `blackboard/journal.jsonl` 尾部 20 行。
3. 读自己的共享任务和写入范围。

## 规则

- 只读黑板和 journal，不写、不建第二份看板。
- 只写自己 scope 里的文件；跨 scope 先找 Lead。
- 发现、阻塞、交接、收工都通过直接消息汇报 Lead。
- 汇报附路径/命令/URL；不确定标“待核实”。
- 不写密钥、token、个人数据。
- 不直接发布 Release，不覆盖顶层 `data/`。

## 交付格式

- 完成内容
- 涉及文件（路径 + 行号）
- 验证命令/结果
- 遗留项

## 当前角色范围

| 角色 | 范围 |
|---|---|
| backend-agent | `src/` `electron/` |
| ui-agent | `public/` |
| release-agent | `dist/` `docs/RELEASE.md` |
| Lead | `BLACKBOARD.md` `blackboard/` `docs/` |
