# Cross-Skill TP Regression — 2026-09-20

## Matrix

| Skill | Case | Expected shared behavior | Result |
|---|---|---|---|
| Module ST | 完整 Config value space、semantic 与 bins | `complete` | PASS |
| Module ST | 对象成立但 value semantic 缺失 | `draft` + lifecycle report | PASS |
| Module ST | 仅缺 coverpoint implementation object | `complete` + mapping TODO | PASS |
| Path | 完整 legal address、路由与响应 | `complete`，地址 bins 使用共享 Contract | PASS（stimulus sampling 与 bin expansion 职责已分离） |
| Path | 越界对象成立但响应行为缺失 | `draft` + lifecycle report | PASS（旧“不生成 TP”规则已移除） |
| Path | 目标和 method 完整、仅缺实现对象 | `complete` + mapping TODO | PASS |
| Feedthrough | endpoint、mapping、condition、clock、N 完整 | `complete` + assertion | PASS |
| Feedthrough | 对象成立但 N 缺失 | `draft` + lifecycle report | PASS |
| Feedthrough | goal 与 assertion method 完整、仅缺 property ID | `complete` + mapping TODO | PASS |

## Hard Findings

### 1. Path 仍保留一套旧正式 TP 模型

正文后半段仍以 `Condition`、`Expected Behavior`、旧 coverage object 和“不生成 TP”定义正式输出，与共享字段、Lifecycle、当前 schema 和 generator 冲突。这是当前最大硬问题。

**Resolution：** 已于 2026-09-20 完成正文、Base setup、push、seed 与 regression 的字段和 Lifecycle 闭环；本项关闭。

### 2. Path 地址阈值冲突

共享 Address Coverage Contract 以 legal value 数量 `≤64 / >64` 决定逐值或分区 bins；Path 仍使用 `threshold_candidates = 1000` 决定地址扫描方式。两者职责未区分，导致同一地址空间可能产生不同输出。

**Resolution：** 已分别命名为 `coverage_bin_expansion_limit = 64` 与 `address_stimulus_sampling_threshold = 1000`；前者只管 bins 表达，后者只管 stimulus candidate selection。本项关闭。

### 3. Module implementation TODO 有局部放宽

Config / Dynamic 规定非 category-required mapping 未知时允许为空；共享 Contract 要求已知 method 但缺实现绑定时写具体 TODO。Lifecycle 一致，但输出行为不一致。

**Resolution：** Config、Dynamic、value/input-space reference 与 regression 已统一为具体 TODO；仅 method 确实不需要独立实现对象时允许为空。本项关闭。

### 4. Feedthrough draft 被输入 schema 阻断

业务规则允许 condition、target clock 或 N 缺失时生成 draft；输入 schema 却把 condition 与 N 设为 required。schema 会在 Lifecycle 判定前拒绝此类输入。

**Resolution：** 输入 schema 已将 complete 条件移交 Lifecycle；输出 schema 只对 complete TP 强制 scenario、goal 和 clock domain。本项关闭。

## Regression Conclusion

9 个横向案例全部通过。共享 Lifecycle 稳定；三类 Skill 对完整、design-semantic 缺失、implementation-binding 缺失的状态与输出行为一致。第一轮公共契约迁移闭环完成，不需要扩展共享 Contract。

## 2026-10-08 Coverage Ownership Extension

- 单对象 structured value/input-space coverage 的 tracking、partition、numeric/address profile、negative bin semantics 与 Lifecycle Gate 由共享 Contract 唯一定义。
- Module 只决定 Config / Dynamic 的对象、profile routing 与 verification dimension，不复制公共 bins 规则。
- Cross coverage 保持 category-specific，不套用单对象 coverage contract。
