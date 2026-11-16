---
name: skill-engineering
description: 设计、创建、完整审查、修改和治理可复用 Codex Skill，并用 Baseline、Intended Delta、Preserved Behavior、Semantic Diff 与 Regression Gate 防止能力回退。用于判断工作是否值得沉淀为 Skill，或处理 Skill 的结构、规则、演进、DEVLOG 和语义回归；不负责具体业务语义或项目代码。
---

# Skill Engineering

默认使用中文，表达简洁、直接、可判断。只治理“如何构建和维护 Skill”，不替具体 Skill 决定业务规则，不把一次性任务包装成 Skill，不建立 registry、plugin layer、inheritance model 或其他无实际作用的框架。

## 核心原则（唯一权威定义）

- **P1 可复用能力：** Skill 面向可复用能力，不面向单次任务。
- **P2 当前能力：** `SKILL.md` 描述当前完整能力，不描述开发过程；历史变化进入 `DEVLOG.md` 或 migration 文档。
- **P3 最小 Demo：** Demo 不是默认组成。只有分类边界、命名或易误判点确实需要时才保留最小 demo；demo specifics 不得反向成为通用模板。
- **P4 规则定义边界：** 通过职责和规则定义边界，不堆免责声明。
- **P5 不提前抽象：** 不提前增加没有实际作用的信息、字段、流程或抽象。
- **P6 输入输出明确：** 输入与输出必须明确。
- **P7 内部自洽：** 职责、输入、处理、输出和实际行为必须使用同一模型。
- **P8 重构不回退：** 结构优化不得造成已有能力回退。重构、去重、删除字段或调整输出结构时，不得丢失仍影响对象识别、目标、条件、结果判断、生成行为或人工评审可读性的能力。
- **P9 分阶段执行：** 复杂 Skill 默认支持分阶段执行。
- **P10 正反规则：** 规则同时定义生成什么与不生成什么。
- **P11 核心模型优先：** 新需求先判断是否改变核心模型；局部细节不得污染核心模型。
- **P12 结构治理：** 出现规则重复、职责漂移、例外堆积、多处联动修改等结构性维护成本时，优先治理结构，而不是继续局部补规则。

引用原则时使用以上编号和定义，不在其他文件复制另一套原则正文。

## 选择工作模式

先识别用户要做的事：

1. 判断是否值得沉淀：执行“建立决策”。
2. 新建 Skill：执行“创建流程”。
3. 检查或 review 已有 Skill：执行“完整审查”。
4. 修改、重构或生成修改 prompt：执行“演进闭环”。
5. 处理维护成本：必要时执行“结构治理”。

复杂任务可分阶段交付，但每一阶段都必须说明输入、产出和未决项。用户逐条讨论时，一次优先解决一个硬问题；若只有一个硬问题，先报告该问题，不用大量软建议稀释它。

## 建立决策

判断一个工作是否同时具备：稳定目标、可复用输入、可重复处理过程、明确输出、可定义边界、持续复用价值，以及“不沉淀就会反复讨论或判断”的成本。不要用执行次数作为机械阈值，也不要输出复杂评分表。

典型正向信号包括：同类任务会复用；已有稳定判断规则；方法可跨项目；用户反复纠正同类行为；需要稳定保留能力；已出现 DEVLOG、regression 或 lifecycle 维护；流程已从 prompt 演进为持续能力。

典型反向信号包括：一次性任务；只有项目特定结论；输入输出不稳定；主要问题仍在探索；规则没有闭环；新增 Skill 只增加包装或名字，不改变实际输入、处理或输出。

输出 `适合建立`、`暂不适合建立` 或 `已接近适合但仍缺关键闭环`，并给最关键原因。

## 创建流程

按依赖顺序建立最小充分模型：capability → scope / boundary → input → output → core model → execution flow → output contract → failure / missing-input behavior。随后删除无必要字段、流程和抽象，再判断是否需要 demo、regression、DEVLOG 或 supporting references。

规则必须同时说明生成什么和不生成什么。缺少决定性输入时，报告缺口及影响，不猜测。不得仅因未来“可能需要”而加入额外字段、中间对象、状态机、mapping、registry、inheritance model、plugin layer 或 parallel schema。

## 完整审查

审查当前完整 Skill，不只检查最近修改。依次验证：

1. scope 是否漂移；
2. core model 是否唯一；
3. category / object model 是否冲突；
4. input / output 是否闭合；
5. 同一概念是否有多个 source of truth；
6. lifecycle / missing-input 是否一致；
7. output contract 是否与生成规则一致；
8. final gate 是否实际验证前文规则；
9. 是否残留旧规则；
10. 结构治理是否造成能力回退；
11. 是否发生局部 patch stacking；
12. 是否存在无必要抽象。

先给当前规则与问题原因，再提出修改。区分硬问题与优化建议，并优先处理最重要的硬问题。

## 演进闭环

### 1. 确认 Baseline

`Baseline = 当前真实已落地版本`。通过读取实际文件、版本或用户确认建立证据，不得默认上一轮建议或 prompt 已执行。

- 上一轮未落地：把新需求累计到真实 Baseline，交付一份完整可执行修改或 prompt，不让用户手工拼接多个 patch。
- 上一轮已落地：才基于新版本交付最小增量。

### 2. 定义 Intended Delta

写明本次明确允许变化的行为。不得只写“改措辞”“优化结构”或“清理规则”；应描述字段、粒度、默认行为、约束、输出或判断方式如何变化。

### 3. 定义 Preserved Behavior

识别旧规则中错误限制与仍在保护的有效能力，明确哪些行为本轮不得改变。重构、去重、删字段、重排输出、简化 category 或清理默认行为时必须执行此项；不得用“其他不变”代替具体说明。

### 4. Impact Closure

任何修改实施前，必须确定 `Affected Rule Set`：所有直接定义、约束、引用或验收本次 Intended Delta 的现有规则。至少沿以下位置闭合检查：

- 上位 generic rule；
- local / category-specific rule；
- lifecycle / completeness rule；
- output contract；
- final gate / regression rule。

新增或修改 category-specific rule 时，必须检查其与上位 generic rule 是否冲突。修改某字段的职责、必需性或生成行为时，必须检查该字段所有 definition、usage、lifecycle、output 和 gate 位置。

完成当前 Intended Delta 的 Impact Closure 后，若发现不属于本次 Affected Rule Set、且并非本次修改引入的问题，不得顺手修改；将其记录为独立后续 change。

### 5. 实施修改

删除或替换与 Intended Delta 冲突的旧规则；保持唯一 source of truth，并让职责、输入、处理、输出、failure behavior 与 final gate 使用同一模型。

### 6. Semantic Diff

比较修改前后的行为模型，而非只看文字 diff。按适用范围检查：对象识别、category、granularity、verification goal、coverage method、coverage bins、lifecycle、relation / dependency ownership、scenario behavior、output schema、merge / display、language / readability、missing-input behavior。

不属于 Intended Delta 的行为变化默认是 regression。

### 7. Change Regression Gate

交付前必须同时满足：

`Observed Behavior Change ⊆ Intended Delta`

`Preserved Behavior 未回退`

`Affected Rule Set 内无语义冲突`

`generic rule 与 specific rule 职责一致`

`downstream lifecycle / output / final gate 与新模型一致`

若发现非预期变化，停止交付，先归因、修正，再验证。不得以模型更统一、表达更简洁、规则更少或抽象更漂亮为由接受能力回退。

## Regression 失败归因

按顺序判断：当前核心模型是否确实缺规则；修改是否误删已有能力；source of truth 是否漂移；新旧规则是否冲突；是否仅为 execution 未遵守已有规则。

如果当前 Skill 已明确表达正确行为而执行未遵守，不向 `SKILL.md` 继续添加补偿性规则；优先修执行或验证路径。

## Semantic Regression Set

复杂或持续演进的 Skill 可建立最小 semantic regression set。它只验证核心能力和历史真实 regression，以关键 semantic assertions 为准，不做全文 snapshot，不要求逐字一致，case 数量保持最小充分。具体业务 Skill 自己维护其业务 case。

Demo 用于解释边界；regression 用于验证能力未回退。两者分开。Regression case 放在 `regression/`、`tests/` 或其他开发侧目录，不塞进 `SKILL.md` 正文。

## 结构治理

出现以下任一结构性信号时，评估治理，而不是继续补局部规则：同一规则多处重复；一个语义要同步多个 section；exception 持续增加；source of truth 不唯一；新需求频繁补偿旧规则；final gate 与正文漂移；output contract 与生成行为不一致；局部修改经常造成无关 regression。

治理顺序：找到 source of truth → 明确各部分职责 → 删除重复 → 保留必要引用 → 执行 Semantic Diff → 执行 regression。

## DEVLOG

`DEVLOG.md` 只记录该 Skill 的真实演进，不进入当前规则正文。每条使用：

- `Problem`：真实失败或维护问题。
- `Root Cause`：模型或结构根因，不写表面现象。
- `Change`：改变了什么行为模型。
- `Preserved Behavior`：具体列出不得回退的已有能力。
- `Validation`：记录 Intended Delta 是否生效、Preserved Behavior 是否通过、是否有 unintended semantic diff。
- `Pending`：只记录真实未决问题；没有则写“无”。

## 修改 Prompt 的输出约束

生成 Skill 修改 prompt 时，先确认 Baseline 是否真实落地，再按“演进闭环”决定累计完整 prompt 或最小增量 prompt。Prompt 优先包含：Baseline、Intended Delta、Preserved Behavior、需删除或替换的冲突旧规则、Semantic Diff / Regression checks，以及“除以上行为外不改”。

## 最终检查

交付前确认：P1–P12 只有一个权威定义；建立决策明确；创建、审查、演进职责分离；Baseline、Intended Delta、Preserved Behavior、Semantic Diff 闭环；P8 已由 Change Regression Gate 落实；结构治理能阻止 patch stacking；DEVLOG 与当前规则分离；regression 只定义通用方法；没有无效 framework；该 Skill 能实际用于判断、新建、审查、修改和防回退。
