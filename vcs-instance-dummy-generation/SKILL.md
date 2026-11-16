---
name: vcs-instance-dummy-generation
description: Generate a same-named SystemVerilog dummy module and VCS instance-level replacement setup from a top-level HDL file and one direct child instance name. Use when Codex must extract an instance interface from top.v, infer port directions and declarations, preserve explicit parameter overrides, add stable-input assertions and simple output drives, create a VCS config and synopsys_sim.setup library mapping, or convert an existing `vcs -f ... -top ...` command into compile and elaboration commands for instance dummying.
---

# VCS Instance Dummy Generation

默认用中文说明结果。生成代码、配置和命令时保留项目原有命名风格。

## 职责与边界

根据 `top.v` 和一个直接子实例 `instance_name`，生成仅替换该实例的 VCS dummy 方案。只处理 `top.v` 所定义 top module 中的直接子实例；不要递归选择实例。

只生成以下内容：

1. 与目标实例原 module 同名的 dummy SystemVerilog module。
2. VCS instance config。
3. `synopsys_sim.setup` 与 dummy library mapping。
4. 从现有 `vcs -f ... -top ...` 风格命令转换得到的 compile/elaboration 命令。

不要执行或加入：

- 自动判断哪些实例值得 dummy。
- 性能 profiling。
- behavior model。
- demo、额外脚本或与本次生成无关的工程重构。
- 读取目标 module 源码来补全接口。

不得猜测无法唯一推导的信息。使用 `unresolved` 报告不确定项；方向证据冲突时使用 `direction conflict`。

## 输入

要求：

- `top.v`：包含 top module、目标直接子实例及其连接信号声明。
- `instance_name`：top module 下目标直接子实例名。

为生成可执行构建命令，还应读取用户现有的 `vcs -f ... -top ...` 命令、filelist 路径和已有 `synopsys_sim.setup`（如存在）。缺少这些内容时，仍可生成确定的 HDL 结果，但将受影响的构建项标记为 `unresolved` 并列明所需输入。

开始生成前确认：

- `instance_name` 在 top 中唯一匹配。
- 该实例确为 top 的直接子实例。
- 能提取实例的 module name、named/ordered port connection 和显式 parameter override。
- ordered connection 只有在端口名可由现有输入唯一确定时才继续；否则标记相关端口为 `unresolved`。

## Inactive hierarchy 生成模式

当用户明确要求 Inactive Dummy、且 hierarchy top 已包含目标 named instance connection 时，使用本节；本节对后续关于“必须读取原 module declaration”、input assertion 和 output `'x` drive 的通用规则优先。

- 不默认要求 internal module declaration。先从 instance connection 与 root/top declaration 提取该 instance 的 effective interface。
- port name 来自 named port connection；显式 named parameter override 的名称和值来自实例化语句。ordered connection/override 无法唯一恢复名称时仍报 `unresolved`。
- direction 只使用以下命名证据，不从协议常识或 wire 名字含义猜测：
  - named port 的 `_i` 后缀为 `input`，`_o` 后缀为 `output`；suffix rule 不检查 connected signal。
  - port 或 simple connected signal 的 `A2B_xxx` 表示 A producer、B consumer。以目标 instance name 和 module name 机械归一化得到当前 block identity；可使用去除 `u_`/`top`/`dummy` 等通用词、underscore token、连续 token 拼接与常见短端点缩写，但不得写死具体项目 block 名。端点无法唯一对应当前 block 时不采用该证据。
  - 收集所有适用证据：单一结果采用；多个结果一致采用并报告 `both rules agreed`；冲突时报 `direction naming conflict`；无证据时报 `unresolved direction`。
- width/type 从 connected expression 推导。支持 simple signal、sized constant、fixed bit/part select、可解析 concatenation，以及保留 root parameter 的 symbolic packed range。empty connection 没有其他权威 width 来源时报告 `port type/width unresolved`。
- 先输出逐 instance 的 direction resolution summary：`suffix rule resolved`、`A2B rule resolved`、`both rules agreed`、`naming conflict`、`unresolved`，并保留逐 port evidence。
- 任何 direction conflict、unresolved direction 或 unresolved width 都必须 fail-fast；可以生成诊断报告，但不得生成看似可用的 dummy RTL。
- Inactive Dummy 不生成 input assertion；所有已解析 output 持续驱动 deterministic inactive value `'0`，input 不由 dummy 驱动。场景合法性 checker/assertion 保持为独立人工 source。
- VCS config 绑定的是目标 instance，而不是同 module type 的全部 instance。replacement module 只需覆盖该 instance 实际引用的 named ports 与显式 parameter overrides，不要求复制原 module 中未连接的 ports。

## 提取实例接口

只以 top 中的实例化语句和连接到该实例的 top 表达式为事实来源：

1. 提取目标实例的原 module name，并将 dummy module 命名为该 module name。
2. 提取每个 port connection 的 port name 与 top-side expression。
3. 提取 `#(...)` 中显式出现的 parameter name/value。
4. 不读取原 module 定义，不补造未出现在实例化语句中的 parameter 或 port。

对 parameter override：

- named override：在 dummy 中声明同名 `parameter`，保留原 value expression。
- ordered override：若 parameter name 无法从现有输入唯一确定，标记为 `unresolved`，不要虚构名称。
- 无 override：不要额外声明 parameter。

## 推导 port direction

方向均以 dummy module 端口视角表示。对 port name 和可解析的 top-side signal name 做大小写不敏感的 token/后缀检查：

- `*_i` 推导为 `input`。
- `*_o` 推导为 `output`。
- `X2B`（从外部 X 指向被替换 block B）推导为 `input`。
- `B2X`（从被替换 block B 指向外部 X）推导为 `output`。

汇总所有可用证据：

- 所有证据一致时采用该方向。
- 同一 port 同时得到 `input` 与 `output` 证据时，报告 `direction conflict`，列出冲突证据，不生成猜测方向。
- 没有方向证据时，报告 `unresolved`。
- 不根据 top 中信号是 `wire` 或 `logic` 猜测方向。

## 推导 width 和 type

从目标 instance 实际连接的 top signal declaration 推导 dummy port declaration：

- 支持简单 signal、bit-select 和 part-select。
- 简单 signal 继承其可确定的 net/variable type、signedness 与 packed dimensions。
- bit-select 的 width 为 1；保留能确定的标量类型语义。
- 常量范围 part-select 按选择范围推导 width；保留能确定的 signedness/type。
- 连接为 concatenation、cast、function call、算术/逻辑表达式、动态 select、interface/modport 或其他复杂 expression 时，只有在声明能唯一确定时才生成；否则报告 `port type/width unresolved`。
- 不读取目标 module 源码来反推声明。

不得把未知 width 默认为 1，也不得把未知 type 静默默认为 `logic`。可以继续生成不受影响的其他端口，并在结果中列出阻塞项。

## 识别 clock 和 reset

按名称做大小写不敏感识别：

- 名称 token 含 `clk` 或 `clock` 的端口视为 clock。
- 名称 token 含 `rst` 或 `reset` 的端口视为 reset。

clock/reset 仍保留在 dummy 接口中，但从“复位后必须保持稳定”的普通 input 集合中排除。若存在多个候选、方向冲突，或无法唯一选择 assertion 使用的 clock/reset，则报告 `unresolved`，不要任意选择。

reset 名称以 `_n` 或 `nreset`/`nrst` 表示低有效；其余已识别 reset 按高有效处理。assertion 默认在已唯一识别 clock 的上升沿采样；如果项目输入明确给出其他边沿，以项目输入为准。

## 生成 dummy module

生成合法 SystemVerilog，module name 与原目标 module name 完全相同，并包含：

- 可确定的 parameter declarations。
- 可确定方向、width 和 type 的 port declarations。
- 普通 input 的稳定性 assertions。
- output 的静态 drive。

### Input assertion

对排除 clock/reset 后的每个 `input`，生成 assertion，检查它在 reset 解除并已连续处于非 reset 状态后保持 `$stable`。使用唯一识别的 clock/reset 和正确 reset 极性，避免在 reset 解除的首个采样点误报。

如果缺少唯一 clock 或 reset，不要生成无时钟或任意时钟的 assertion；将所有受影响 assertion 标记为 `unresolved`。

### Output drive

按 output port 名称做大小写不敏感 token 检查：

- 名称包含 `req`、`valid` 或 `en`：持续驱动为 `'0`。
- 其他 output：持续驱动为 `'x`。

每个 output 只能有一个 driver。不要加入协议响应、状态机、延迟或其他 behavior model。

## 生成 VCS instance config

生成独立 config，使 top design 中且仅有目标层次实例绑定到 dummy library 中的同名 module。配置应明确包含：

- config name。
- 原 top design 的 library/module。
- 目标实例的完整层次路径。
- `use <dummy_library>.<original_module_name>` 绑定。
- 其余实例沿用原设计绑定。

若 top library、完整实例路径或 VCS config 语法所需的项目命名无法唯一确定，标记对应字段为 `unresolved`，不要生成看似可执行但绑定范围不明的配置。

## 生成 library mapping

为 dummy 使用独立逻辑库和物理目录，例如 `DUMMY_LIB` 与 `./simv_lib/DUMMY_LIB`，但优先遵循项目已有命名。

生成或给出对现有 `synopsys_sim.setup` 的最小增量：

- 保留已有 mapping 与 `OTHERS` 链。
- 添加 dummy logical library 到独立物理目录的 mapping。
- 保持原 design/work library mapping 不变。
- 不覆盖用户已有同名 mapping；若同名库指向不同目录，报告 conflict。

## 转换 VCS 构建命令

以用户现有 `vcs -f <filelist> -top <top> ...` 为基线，输出分离的 compile 和 elaboration 命令：

1. 编译原设计 source/filelist 到原有 design libraries，保留 include path、macro、language、architecture、debug 和必要的编译选项。
2. 单独将 dummy module 编译到 dummy library。
3. 编译 VCS config 到适当 library。
4. elaboration 时以 config name 作为 top，使 instance binding 生效，并保留原命令中属于 elaboration/link 的选项。

转换时：

- 不把 dummy module 加进原 module 所在 library，避免同名 module 冲突。
- 不从原 filelist 删除原目标 module；instance config 负责对指定实例重新绑定。
- 保留原 `-f`、`-top` 及其他选项的语义，并明确展示选项如何分配到 compile/elaboration 阶段。
- 对无法确认属于编译还是 elaboration、路径不存在或依赖项目脚本展开的选项，标记为 `unresolved`，不要静默丢弃。

## 输出与检查

输出以下工件及一份简短报告：

1. `<original_module_name>_dummy.sv`，其中 module 声明仍使用原 module name。
2. VCS instance config 文件。
3. `synopsys_sim.setup` 新文件或最小 patch。
4. compile/elaboration 命令。
5. 推导表：port、connection、direction evidence、resolved direction、type/width 来源、clock/reset 分类。
6. parameter override 表。
7. `direction conflict`、`port type/width unresolved` 和其他 `unresolved` 列表。

完成前检查：

- 只替换指定直接子实例。
- dummy module 同名且位于独立 library。
- parameter override 名称和值均来自实例化语句。
- 每个已生成 port 的 direction 与 declaration 都有可追溯依据。
- clock/reset 未被生成稳定性 assertion。
- 每个普通 input 都有稳定性 assertion，或被明确列为 unresolved。
- `req`/`valid`/`en` output 驱动 `'0`，其他 output 驱动 `'x`。
- config、library mapping 和 elaboration top 彼此一致。
- 未加入性能分析、自动实例选择或 behavior model。
