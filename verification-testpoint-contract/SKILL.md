---
name: verification-testpoint-contract
description: 为验证 Testpoint 类 Skill 提供统一字段职责、Lifecycle、实现 TODO、可读可生成输出、value/input-space、地址覆盖和 RAW 契约。Use whenever creating, governing, generating, or reviewing verification TP across module, path, feedthrough, or other TP skills.
---

# Verification Testpoint Contract

本 Skill 是 TP 类 Skill 的共享契约。业务 Skill 只定义对象、粒度、输入和 category-specific 行为；不得复制或改写本文件的通用规则。若业务规则明确要求额外字段或 implementation mapping，可在不冲突的前提下收紧 complete 条件。

## Common Fields

所有正式 TP 使用：

- `TP_ID`：唯一定位验证对象。
- `lifecycle_status`：只使用 `complete`、`draft`、`blocked`。
- `verification_scenario`：构造、触发或观察 TP 的实际条件；category 不需要独立场景时可不输出。
- `verification_goal`：当前对象、条件及其预期语义；不得只写“符合预期”“正确处理”。
- `coverage_strategy`：testcase、assertion、covergroup 或 category-specific structured bins 等验证/覆盖方法。
- `coverage_strategy_mapping`：具体实现对象，或缺少实现绑定时的明确 TODO。

业务定位字段仅在无法由 sheet、层级或 TP_ID 唯一确定时输出。`expected_result` 仅在结果无法自然放入 `verification_goal` 时使用，不建立与 goal 平行的重复语义。

## Lifecycle

- **complete**：对象、场景（适用时）、`verification_goal`、验证方法及 category-required 信息完整。
- **draft**：对象和验证方向成立，但完成目标所需的部分 design semantic 缺失。
- **blocked**：对象、目标方向、方法方向或必要行为判定无法成立。

不得因信息不完整而删除已经成立的 TP。任一 draft / blocked TP 必须进入 lifecycle missing-input report，记录 `affected_tp_id`、`lifecycle_status`、`missing_content` 和 `completion_or_unblock_condition`。

生成阶段的 candidate、pending 或 intermediate object 不是 TP lifecycle，不得写入正式 TP 的 `lifecycle_status`。missing-input 是 report，不是 lifecycle status。

### 中文表格展示与执行状态

正式机器字段保持上述英文 canonical schema；面向人工评审的中文表格使用以下展示映射：

- `lifecycle_status` → `状态`：`complete=完整`、`draft=草稿`、`blocked=阻塞`。
- `verification_scenario` → `TP场景`。
- `verification_goal`不单独显示；其不可丢失的预期行为或覆盖目标并入`TP场景`，避免与场景重复成两列。
- `coverage_strategy`中的 testcase 构造方法拆到独立`Testcase`列；`覆盖策略`只保留 covergroup、assertion 或其它结构化覆盖方法。
- `coverage_strategy_mapping` → `覆盖映射`。

`状态`只描述 TP 定义完整度，不表示执行结果。表格另加：

- `测试状态`：`未测试`、`测试中`、`已测试`，默认`未测试`；只有测试执行证据才能更新。
- `覆盖状态`：`未覆盖`、`部分覆盖`、`已覆盖`，默认`未覆盖`；只有覆盖率结果才能更新。

禁止因 TP 为`完整`就自动标记`已测试`或`已覆盖`，也禁止把测试/覆盖结果写回 Lifecycle。

## Implementation TODO

verification goal 与 method 已完整、仅缺非 category-required HDL signal/path、clock、sample event、testcase/property/coverpoint 名称或其他 implementation binding 时：

- TP 保持 `complete`；
- `coverage_strategy` 只写实际 method；
- `coverage_strategy_mapping` 写 `TODO（missing <具体 implementation input>）`；
- 不得使用笼统的 `missing implementation input`；
- 生成脚本不生成该实现对象，并输出对应 implementation TODO；
- 不进入 lifecycle missing-input report。

category-specific rule 明确要求 mapping 才能判定目标时，缺失仍按该业务规则标记 draft 或 blocked。

## Output Quality

所有 TP 必须同时满足：简洁、人工可读、脚本可确定性转换、Excel 中不堆大量实现代码。实际值、范围、条件和行为直接写出；不得用“完整覆盖”“符合预期”“按设计处理”等需要重新查询输入件的占位描述。

涉及单对象 structured value/input-space coverage 时读取 [Value/Input-Space Coverage Contract](references/value-input-space-coverage.md)；其中地址对象继续读取 [Address Coverage Contract](references/address-coverage.md)。涉及写后读验证时读取 [Access RAW Contract](references/access-raw.md)。

## Final Gate

交付前确认：字段职责唯一；Lifecycle 与缺失输入一致；中文展示映射没有丢失预期行为；测试状态和覆盖状态有执行证据且未与Lifecycle混用；implementation TODO 位于 mapping；category-specific rule 未放宽或覆盖共享规则；输出 schema、模板、脚本和 final gate 使用同一模型。
