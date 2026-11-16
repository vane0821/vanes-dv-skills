# Development Log

## 2026-09-20 | Shared TP Contract Migration

- **Problem**：正式输出与共享 TP 字段不一致。
- **Root Cause**：Expected Behavior、property 与公共字段形成平行模型。
- **Change**：接入共享字段、Lifecycle 与 implementation TODO；值关系和时序合入 `verification_goal`；assertion method 与 property mapping 分离。
- **Preserved Behavior**：一项 Definition 对应一个 TP；Interface mapping 不拆 TP；Target Clock 观察语义和 assertion 默认方法不变。
- **Validation**：输出 schema 与模板使用公共字段。
- **Pending**：无。

## 2026-09-20 | Feedthrough Structure Governance

- **Problem**：相同规则分散在 14 章与三个正文示例中，且残留 Expected Behavior 和覆盖策略.assertion 旧模型。
- **Root Cause**：输入说明、业务模型、输出格式和总结重复承担规则定义。
- **Change**：正文收敛为 Input、Object、Timing、Goal/Method、Identity、Lifecycle、Output；值关系使用可生成表达式，默认 mapping 为 target == source；详细结构由 schema 与唯一模板承载。
- **Preserved Behavior**：一 Definition 一 TP；Interface 不按 mapping 拆分；Signal 粒度可用；Source/Target clock domain 必需；N=0 的含义、默认 assertion 和不猜测规则不变。
- **Validation**：正文、input/output schema、模板、missing-input 与 regression 使用同一字段和 Lifecycle。
- **Pending**：无。

## 2026-09-20 | Draft Input Lifecycle Closure

- **Problem**：业务 Lifecycle 允许缺 condition、clock domain 或 N 时生成 draft，但输入 schema 在判定 Lifecycle 前拒绝这些输入；输出 schema 也对 draft 无条件要求 scenario 和完整 goal。
- **Root Cause**：schema 把 complete 条件错误提升为 parse / object-establishment 条件。
- **Change**：输入 schema 以 Source module/interface、Target module/interface 和 mapping 建立对象；condition、clock domain、N 交由 Lifecycle。输出 schema 仅对 complete TP 强制 scenario、goal 和 endpoint clock domain；draft 模板保留已知值关系并输出 lifecycle report。
- **Preserved Behavior**：complete 仍要求 Source/Target clock domain、condition、target clock、N 和完整 goal；一 Definition 一 TP、mapping 粒度、N 语义和默认 assertion 不变。
- **Validation**：缺 N 案例可通过 schema 进入 draft，且不会被误判为 complete；对象未成立仍只输出 scope report。
- **Pending**：无。
