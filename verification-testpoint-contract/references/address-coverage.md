# Address Coverage Contract

本文件是 TP 类 Skill 的地址 value/input-space 描述与 coverage partition 的唯一共享定义。业务 Skill 负责补充 Path、Region、协议操作、路由或响应等自身语义。

## Verification Goal

地址目标按实际适用项逐行输出：

```text
合法地址范围：<legal_range>
下边界：<lower>
上边界：<upper>
典型地址：<typical>
下越界范围：<below_range> -> <input-defined behavior>
上越界范围：<above_range> -> <input-defined behavior>
```

不存在的项目删除，不输出占位符。多个不连续合法区间分别保留边界。

typical 是 coverage sample，不构成 DUT semantic。存在内部合法地址时选择 `floor((lower + upper) / 2)`；若落入 hole，选择距离中点最近的合法地址，距离相同时选较小者；没有内部合法地址时不生成 typical。

## Coverage Strategy

`coverage_bin_expansion_limit = 64`，只决定 coverage bins 的表达粒度，不决定 stimulus candidate 的选择或执行次数。

合法地址值数量 `≤ coverage_bin_expansion_limit` 时，每个合法地址生成独立 single-value bin。超过该值时固定使用：

```text
cover bins：
boundary = {<lower>, <upper>}
typical = {<typical>}
legal = {<remaining legal ranges>}
out_of_range = {<complete representable below/above ranges>}

illegal bins：
<input-defined illegal values/ranges or 无>
```

不存在 typical 或 out-of-range 时删除对应行。每个 bin 独占一行；必须给出实际值或 `[lower:upper]`，不得写“逐地址覆盖”“完整地址 bins”“剩余范围”。

## Negative and Illegal

- invalid、reserved、unsupported、hole 或 out-of-range 是 design semantic，不自动决定 bin type。
- 需要主动验证其 DUT 行为时使用普通 bins。
- 只有输入资料明确规定采样值本身不应出现时使用 `illegal bins`。
- DUT 返回 error 不等于该值应进入 `illegal bins`。
- 可表示的越界空间存在但行为未定义时，TP 为 draft；不得猜测行为或 bin type。

## Boundary

本 Contract 只统一地址集合、边界、典型值、越界空间和 bins 表达。模块字段自身地址空间、Path 路由正确性、访问宽度/对齐及协议响应继续由对应业务 Skill 定义。
