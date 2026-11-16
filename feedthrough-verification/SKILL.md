---
name: feedthrough-verification
description: 根据 Feedthrough Definition 生成 Feedthrough Testpoint（TP）及覆盖策略，默认以 assertion/property 验证 Source-to-Target 透传值和时序。Use when the user asks to create Feedthrough TP, coverage strategy, assertion/property, verify Source-to-Target pass-through value and timing, or report missing Feedthrough Definition inputs. Default output language is Chinese.
---

# Feedthrough Verification

根据 Feedthrough Definition 生成 Source-to-Target 值与时序 TP。默认使用中文；正式 TP 的公共字段、Lifecycle、implementation TODO 和输出质量遵守 [Verification Testpoint Contract](../verification-testpoint-contract/SKILL.md)。

## 1. Input Model

完整的 Feedthrough Definition 包含：

- `source_endpoint`：module、interface、可选 signal、clock domain；
- `target_endpoint`：module、interface、可选 signal、clock domain；
- `signal_mapping_rules`：至少一条可定位且无歧义的 Source Signal → Target Signal；
- `verification_condition`：Source 事件的实际触发条件；
- `target_clock_observation_edge`：非负整数 N。

Endpoint 固定写为 `Module.Interface` 或 `Module.Interface.Signal`。输入结构读取 [Feedthrough Definition Schema](references/input-schema-feedthrough-definition.yaml)；生成前按 [Input Checklist](references/input-checklist.md) 检查。不得根据名称或接口习惯猜测 endpoint、mapping、condition 或 timing。

输入 schema 允许 condition、clock domain 或 N 缺失，以便对象成立后进入 Lifecycle；schema 可读入不等于 TP complete。

## 2. TP Object and Granularity

一个 Feedthrough Definition 生成一个 TP：

- Interface → Interface：所有 mapping 作为同一 TP 的多个检查项，不按 signal 拆分；
- Signal → Signal：生成一个 signal 粒度 TP；
- 两种粒度使用同一输出模型。

Source、Target 与 mapping 共同定义 TP 对象。Source 和 Target 可以跨 clock domain；clock domain 只定位时钟，不用于推导时序。

## 3. Timing Model

统一以 Target Clock 为观察基准：Source 条件成立后，在第 N 个 Target Clock 有效边沿检查全部 mapping。

- N = 0：条件成立后遇到的第一个 Target Clock 有效边沿；
- N = 1：其后的下一个有效边沿；
- N > 1：按相同方式继续计数。

输出实际 target clock 与 N，不使用“同拍”“下一拍”等相对描述。

## 4. Goal and Method

`verification_scenario` 写 Source 触发条件。`verification_goal` 按实际 mapping 逐行写目标时钟、观察边沿和值关系：

```text
在第 <N> 个 <target_clock> 有效边沿：
  <target_signal> == <source_signal>
  <target_signal> == <source_signal>
```

Feedthrough mapping 默认表示值相等；若输入明确变换、极性或编码关系，右侧写实际关系表达式。不得写 `map(source)`、“符合映射关系”或“正确透传”等不可直接生成 property 的描述。

默认 `coverage_strategy = assertion`，一个 TP 对应一个 property，property 内检查全部 mapping。`coverage_strategy_mapping` 写 property ID；尚未生成 property ID 时按共享 Contract 写具体 implementation TODO。testcase 或 covergroup 只有输入件或用户明确要求时才作为附加 method 输出，不替代 assertion。

## 5. Identity

`TP_ID` 使用 `FT_<source>_TO_<target>`，以大写和下划线规范化，并足以唯一定位 Definition。TP_ID 已表达路径时不再输出平行 Path 字段。

Feedthrough 额外定位字段仅保留：`type`、`source`、`target`、`signal_mapping`。这些字段承载 Definition traceability，不重复 goal。

## 6. Lifecycle

- `complete`：Source、Target、全部 mapping、condition、target clock 和 N 均明确；property ID 可按 implementation TODO 处理。
- `draft`：对象与方向已成立，但 condition、target clock、N 或部分值关系 semantic 缺失。
- `blocked`：Source/Target 对象或 mapping 方向存在冲突、歧义，无法形成可判定目标。

Source、Target 与 mapping 均不足以建立 Feedthrough 对象时不生成 TP，输出 scope missing-input report。其余 draft / blocked TP 保留，并输出 lifecycle missing-input report。

## 7. Output and Execution

正式输出满足 [Feedthrough TP Schema](references/output-schema-feedthrough-tp.yaml)，格式参考 [TP Template](assets/templates/feedthrough-tp-output.template.yaml)。按以下顺序执行：

1. 检查 Definition 并建立 TP 对象；
2. 确定 Interface 或 Signal 粒度；
3. 将 condition 写入 scenario，将 N、target clock 与全部值关系写入 goal；
4. 设置 assertion method 与 property mapping；
5. 判定 Lifecycle 并输出适用的 missing-input report。

交付前确认：一个 Definition 仍只生成一个 TP；Interface mappings 未被拆分；每条 mapping 都在 goal 中有确定性表达；N 的含义未漂移；method 与 mapping 字段职责正确；正文、schema、模板和 lifecycle 使用同一模型。
