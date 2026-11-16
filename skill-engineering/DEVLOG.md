# DEVLOG

## 2026-09-14 — 增加 Impact Closure

### Problem

现有演进闭环只约束行为增量与保留能力，未强制枚举承载同一变化的上位规则、局部规则、生命周期、输出和验收位置，修改可能只闭合局部文本。

### Root Cause

Change Regression Gate 缺少对规则影响传播范围的显式模型，无法直接检验 generic/specific 职责和 downstream 规则是否与新模型同步。

### Change

在 Skill Evolution 中增加唯一的 Impact Closure 定义，要求修改前确定 Affected Rule Set；扩展 Change Regression Gate，并规定闭合后发现的范围外既存问题必须拆为独立后续 change。

### Preserved Behavior

- P1–P12 的编号、原文和权威位置不变。
- Baseline、Intended Delta、Preserved Behavior 与 Semantic Diff 的既有职责不变。
- 创建、审查、结构治理、DEVLOG 和修改 prompt 的其他规则不变。
- 不引入新的 Core Principle 或并行规则模型。

### Validation

- Intended Delta：Affected Rule Set、generic/specific 冲突检查、字段全链路检查、downstream gate 和停止规则已落地。
- Preserved Behavior：P1–P12 未修改；既有演进步骤仅顺延编号，语义未改变。
- Unintended Semantic Diff：未发现。

### Pending

无。

## 2026-09-11 — 初始建立

### Problem

Skill 的沉淀方法、设计原则、演进规则、结构治理和回归验证尚未形成独立、可重复使用的通用能力。

### Root Cause

相关方法存在于讨论和个别实践中，缺少一个职责明确、与业务语义隔离且拥有统一变更闭环的 source of truth。

### Change

建立 `skill-engineering`，统一定义建立决策、创建流程、完整审查、演进闭环、结构治理、DEVLOG 和最小语义回归方法；将 P1–P12 固化为唯一权威原则。

### Preserved Behavior

- 不吸收任何具体项目或业务 Skill 的语义。
- 不把 demo 当成默认组成。
- 不因工程化引入 registry、schema、plugin framework 或其他无实际作用的抽象。
- Skill 当前有效规则与历史记录保持分离。

### Validation

- Intended Delta：通用 Skill 工程能力已形成可执行流程。
- Preserved Behavior：业务隔离、最小充分结构、demo/regression 分离均已保留。
- Unintended Semantic Diff：未发现；这是初始版本，没有旧版本能力需要迁移。

### Pending

无。
