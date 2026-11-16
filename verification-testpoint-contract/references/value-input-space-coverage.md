# Value/Input-Space Coverage Contract

本契约统一定义单对象 value/input-space 的 structured bins、coverage tracking、partition 完整性和 negative bin semantics。业务 Skill 负责确定 coverage target、是否需要独立空间覆盖及 category-specific profile。

## 字段职责与 Tracking

- `verification_goal` 定义完整 value/input space、legal constraint 和 design semantic。
- 当前 TP 的定位字段或层级定义 coverage target；`coverage_strategy` 只写验证方式及可脚本转换的 coverage partitions，不重复对象信息。
- structured bins 默认由 covergroup tracking；testcase 可承担 stimulus construction，但不能替代 bins tracking。输入资料明确其他 tracking mechanism 时按实际机制处理。
- 仅 testcase 且无其他 tracking mechanism 时，不能宣称 structured bins coverage 完整。
- 本契约不定义 random algorithm、iteration、scan order、scheduling、testcase 数量、最小扫描次数或 bin 命中算法。

## Coverage Strategy 输出格式

structured coverage 固定使用换行 bin block：

```text
cover bins：
<bin_name> = {<concrete values or [lower:upper] ranges>}

illegal bins：
<bin_name> = {<concrete values or [lower:upper] ranges>}
```

没有 illegal bin 时写 `illegal bins：` 后换行 `无`。输入资料明确 ignore space 时，在其后追加同格式的 `ignore bins：` block；否则不输出该 block。每个 bin 独占一行，多个 value / range 使用逗号分隔，range 写成 `[lower:upper]`。

bin block 必须直接包含实际 bin name、value 和 range，不使用占位符、`~` 范围、嵌套对象、重复 coverage target，或“完整覆盖”“剩余范围”“逐地址覆盖”等需要二次解释的描述。只有输入资料明确存在非默认采样条件时，才在 block 前增加 `sample event：<actual condition>`。具体 implementation object 由 `coverage_strategy_mapping` 承载。

## Partition 完整性

- 输入资料明确的 special value 使用 explicit bin。
- 独立 numeric value/input-space coverage 使用实际 lower boundary、upper boundary 和一个可表示的 interior typical value；存在多个内部值时选择 `floor((lower + upper) / 2)`，不存在内部值时不生成 typical bin。
- 未被 explicit bins 承接的剩余合法空间由 residual / range bin 准确覆盖。
- bins 必须属于字段可表示且 DUT 可接收的 input domain；legal explicit / residual、negative partition 不扩大、遗漏或错误重叠。
- 除确定性 interior typical sample 外，不创造 representative value 或 semantic category。
- coverage partition 必须由当前输出直接确定，无需重新查询输入或猜测。

## Numeric Coverage Profile

声明独立 numeric range coverage 时，`verification_goal` 直接列出 actual legal range、lower boundary、upper boundary、适用时的 typical value，以及字段可表示空间内的 below-range / above-range space。

`coverage_strategy` 逐行给出 `lower_boundary`、`upper_boundary`、适用时的 `typical`、承接其余合法值的 `legal_remaining`，以及可表示时完整承接非法数值空间的 `below_range`、`above_range` 普通 negative bins。

legal range 覆盖字段全部可表示空间时不生成越界 partition。below-range / above-range 的 DUT behavior 必须来自输入并写入 `verification_goal`；negative space 存在但 behavior 未定义时，对象和 coverage direction 已成立的 TP 标记 draft。

## Address Coverage Profile

地址对象遵守 [Address Coverage Contract](address-coverage.md)，并优先于 Numeric Coverage Profile。业务 Skill 负责确定某对象是否属于 address profile，不从本契约推断对象类型、legal range、地址分类或越界行为。

## Negative 与 Bin Type

- valid、invalid、reserved、unsupported 是 design semantic，不自动决定 bin type。
- 主动验证 negative / invalid / reserved / unsupported 输入及其 DUT 行为时使用普通 bins，并与 legal residual 分离。
- 只有输入明确规定某采样值本身不应出现时使用 `illegal_bins`；DUT 返回 error 不等于该值应进入 `illegal_bins`。
- `ignore_bins` 只用于输入明确不纳入覆盖统计的值。

## Lifecycle Gate

- complete TP 的 structured bins 必须完整承载声明的 coverage space，且 tracking method 满足本契约。
- 对象和 coverage direction 已成立，但缺少 partition 所需的 range、classification、boundary 或 design semantic 时标记 draft，并进入 lifecycle missing-input report。
- 对象、coverage direction 或必要 legal semantic 无法成立时标记 blocked。
- implementation object 尚未生成且非 category-required 时不影响 complete，mapping 按共享 implementation TODO 规则处理。
