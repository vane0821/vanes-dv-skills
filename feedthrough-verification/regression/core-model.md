# Feedthrough Core Model Regression

- 一个 Feedthrough Definition 只生成一个 TP。
- Interface → Interface 的多个 mapping 留在同一 TP；Signal → Signal 使用相同模型。
- N = 0 表示 Source 条件成立后遇到的第一个 Target Clock 有效边沿。
- 每条 mapping 在 `verification_goal` 中输出可生成的值关系；省略 relation 时固定为 `target == source`。
- 默认 `coverage_strategy = assertion`；property ID 只进入 `coverage_strategy_mapping`。
- 缺 condition、clock、N 或部分 relation semantic 时保留 draft TP；对象或 mapping 方向冲突时为 blocked。
- TP 对象尚未成立时只输出 scope missing-input report。
- 输入 schema 允许缺 condition、clock domain 或 N 的 Definition 进入 Lifecycle；输出 schema 仅对 complete TP 强制 scenario、goal 和 endpoint clock domain。
