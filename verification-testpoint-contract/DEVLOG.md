# Development Log

## 2026-09-20 | Shared TP Contract

### Problem

Module ST、Path 和 Feedthrough TP Skill 分别定义 status、字段职责、implementation mapping 和地址覆盖，导致相同问题在每个 Skill 中重复确认并产生语义漂移。

### Root Cause

稳定的 TP 通用模型没有单一权威定义，业务 Skill 同时承担通用契约与业务规则。

### Change

建立共享 TP Contract，统一 Common Fields、complete/draft/blocked、implementation TODO、输出质量及 Address Coverage Contract；业务 Skill 仅保留对象、粒度和 category-specific 规则。

### Preserved Behavior

各业务 Skill 的对象识别、TP 粒度、输入要求、场景语义、method 选择和业务边界不由本 Contract 改写。

### Validation

共享规则职责与 Skill Engineering 分离：前者定义 TP 通用业务契约，后者仍只治理 Skill 构建和演进方法。

### Pending

逐个迁移并验证现有 TP Skill 的 schema、模板和脚本。

## 2026-10-08 | Shared Value/Input-Space Coverage Contract

### Problem

单对象 structured bins、numeric partition、tracking 和 negative bin semantics 已被多个 TP category 使用，却仍由 Module Skill 的 reference 维护，公共规则 ownership 与实际复用范围不一致。

### Root Cause

公共覆盖契约最初从 Module Config / Dynamic 沉淀，迁移共享 Contract 时只提取了 Address 与 RAW，没有闭合 value/input-space 的上位规则。

### Change

将单对象 value/input-space coverage 的通用字段职责、输出格式、partition、numeric/address profile、negative bin semantics 和 Lifecycle Gate 迁入共享 Contract。业务 Skill 只负责对象识别、是否启用独立空间覆盖及 category-specific profile routing。

### Preserved Behavior

现有 structured bins 格式、deterministic typical value、legal residual、negative partition、implementation TODO 和 Lifecycle 判定保持不变；Cross coverage 继续由业务 Skill 自己定义。

### Validation

Module Config / Dynamic 已改为引用共享 source of truth；Address Contract 与 RAW Contract 不变；公共规则只维护一份。

### Pending

其他 TP Skill 在需要单对象 structured coverage 时迁移引用。
