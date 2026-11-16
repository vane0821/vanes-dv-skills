# Semantic Regression Cases

这些 case 只验证 `skill-engineering` 自身的核心能力。判断通过与否时检查语义断言，不比较逐字输出。

## R1：一次性需求不被包装成 Skill

**输入情形：** 用户希望把一个仅用于单项目、输入输出仍不稳定的一次性处理步骤做成 Skill。

**关键断言：**

- 结论为“暂不适合建立”或“已接近适合但仍缺关键闭环”。
- 原因聚焦稳定目标、复用输入、闭合过程或持续价值中的真实缺口。
- 不使用“重复次数”机械评分，不设计额外 framework。

## R2：未执行的修改 prompt 必须累计

**输入情形：** 已有真实 Skill 版本 A；上一轮产生 prompt B 但未执行；用户提出新变化 C。

**关键断言：**

- Baseline 仍为 A。
- 输出基于 A 累计 B 与 C 的完整 prompt，而不是假设 B 已落地的增量 patch。
- 明确 Intended Delta 与 Preserved Behavior。

## R3：结构去重不得损失行为

**输入情形：** 同一规则散落多处，用户要求重构去重。

**关键断言：**

- 先确定唯一 source of truth，再删除重复并保留必要引用。
- Semantic Diff 检查对象识别、输入输出、failure behavior 和可读性等适用行为。
- 只有 Intended Delta 内的行为可以变化；简洁或统一不能成为接受回退的理由。

## R4：执行偏差不触发补偿性规则

**输入情形：** `SKILL.md` 已清楚规定正确行为，但一次执行没有遵守。

**关键断言：**

- 归因为 execution 或验证路径问题。
- 不向 `SKILL.md` 叠加表达同一语义的补偿性规则。
- 建议修复执行或回归验证路径。

## R5：完整审查不局限最近 diff

**输入情形：** 用户要求 review 一个持续演进的 Skill。

**关键断言：**

- 审查完整当前版本，包括 scope、core model、input/output、source of truth、lifecycle、output contract、final gate、旧规则、能力回退、patch stacking 和无效抽象。
- 若只有一个硬问题，优先清晰报告该问题，不用大量软建议稀释结论。

## R6：业务回归不进入通用 Skill

**输入情形：** 用户要求把某具体业务 Skill 的 regression case 加入 `skill-engineering`。

**关键断言：**

- 保持通用方法与具体业务 case 的职责分离。
- 指导将业务 case 维护在对应业务 Skill 中。
- `skill-engineering` 不吸收业务对象、category 或断言。

## R7：字段修改必须完成 Impact Closure

**输入情形：** 用户修改某 category 中一个字段的必需性，同时发现另一个无关 category 存在历史问题。

**关键断言：**

- 修改前枚举该字段相关的 generic rule、category-specific rule、definition、usage、lifecycle、output contract 与 final gate / regression rule。
- 检查 generic rule 与 specific rule 职责一致，且所有 downstream 位置与新模型一致。
- Change Regression Gate 确认 Affected Rule Set 内无语义冲突。
- 无关 category 的既存问题不顺手修改，记录为独立后续 change。
