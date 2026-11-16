# verification-bug-management

本 Skill 是当前 Bug Tool 的可重建能力规格。`SKILL.md` 提供能力入口和不变量，`knowledge/bug-management-model.md` 定义数据模型、全部 CLI、现场采集、Git transaction、并发规则及验收场景。

`bugs/*.yaml` 是 Bug 数据的唯一 Source of Truth；`summary.csv` 是可完整重建的 derived global view。当前 Skill 不包含 Bug Tool 实现代码。
