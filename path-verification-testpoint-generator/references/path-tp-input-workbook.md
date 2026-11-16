# Path TP 统一输入工作簿

## 目的

```text
设计文档 / 代码 / 用户确认
→ 唯一结构化输入工作簿
→ 暴露并人工校准缺失或冲突
→ 生成 Path TP 与 Missing Input 报告
```

生成器只读取校准后的工作簿，不在生成 TP 时重新从多份原始材料临时选择结论。一个项目固定使用五个中文 Sheet：`基础信息`、`通路与地址空间`、`验证规则`、`DUT映射`、`校准问题`。

## 1. 基础信息

同一 Sheet 上下维护两个区块。

### 输入来源

```text
来源ID | 输入类型 | 输入位置 | 提取内容
```

- 飞书材料填写链接或可唯一定位的 token/文档名，文件填写路径，用户确认填写日期和确认内容。
- 不维护来源版本、使用状态或备注；未解决冲突进入 `校准问题`。

### Master/Slave信息

```text
对象ID | 对象类型 | 对象名称 | 协议 | 数据宽度(bit) | 地址宽度(bit) | 支持操作 | 依据 | 确认状态 | 校准问题ID
```

- `对象类型` 仅使用 `Master`、`Slave`。
- `确认状态` 仅使用 `已确认`、`待确认`，不使用“部分确认”。
- `待确认` 行必须填写能明确指出缺失内容的 `校准问题ID`。
- 本表只维护接口自身属性；地址范围、路由和期望响应放在 `通路与地址空间`。

### 自定义协议

当 Master 使用 Custom 协议时，在基础信息中追加：

```text
协议名称 | 通道 | 信号 | 方向 | 位宽(bit) | 含义 | 依据
```

只记录生成 Path TP 所需的请求握手、R/W类型、地址、数据和返回字段；标识字段可作为协议事实保留，但仅在验证规则选择交叉时参与 TP。

## 2. 通路与地址空间

一行定义一个 Master 视角下的连续地址区间、终点和访问分类：

```text
Master | 通路ID | 通路协议 | 起始地址 | 结束地址 | 合法条件 | 非法原因 | 测试操作 | 支持的访问粒度 | 期望响应 | 依据 | 确认状态 | 校准问题ID
```

通路 ID 使用紧凑、可解析格式：

```text
<master>2<slave或region>_<legal|illegal|conditional>_<三位编号>
```

示例：

```text
scp_ctrl2dte_itcm_legal_001
scp_ctrl2dte_itcm_illegal_001
scp_ctrl2none_illegal_001
```

- ID 中的 `_legal_`、`_illegal_`、`_conditional_` 是合法性的唯一来源，不再维护重复的“空间合法性”列。
- `Master`显式填写并按连续通路行纵向合并展示；读取器对合并单元格执行向下继承。
- `通路协议`引用基础信息中的标准协议或自定义协议；同一个 Master 面向不同 Slave 使用不同接口时必须逐 Path 指定，不能只依赖对象表中的默认协议。
- 没有目标 Slave 的空洞使用 `2none`。
- 命中某个 Slave decoder、但超出真实容量时仍保留该 Slave/Region 名称。
- 同一个 Master → Slave/Region 可以有多行连续区间，通过合法性和编号区分。
- 正式 TP 使用 `<通路ID>_tp<三位编号>`；READ/WRITE、地址条件和原因写入 `verification_scenario`，不继续堆入 ID。
- `legal` 行的 `非法原因`必须为空；`illegal` 行必须填写`非法原因`和`期望响应`；`conditional` 行必须填写`合法条件`和条件不成立时的结果。
- `支持的访问粒度`表示全部支持值，例如 `1/2/4 Byte`，不是最小粒度。
- 操作统一使用 `R`、`W`、`RW`。`测试操作`表示 TP 要施加的操作：合法区间用于验证支持操作，非法区间用于尝试该操作并检查 Error；不得解释为非法空间允许该操作。
- 地址是 Master 接口实际可见地址。

## 3. 验证规则

验证规则是 Skill 定义的固定有限选择题，工程师只选择规则：

```text
规则项ID | 配置问题 | 可选项 | 工程选择 | 适用范围 | 依据 | 确认状态 | 校准问题ID
```

固定问题至少覆盖：小/大地址空间扫描、合法区间边界与越界、显式非法空间扫描、合法地址与 READ/WRITE 交叉、边界与访问粒度交叉、非法地址操作、验证方法选择。`工程选择`必须属于对应`可选项`；未选择且影响生成时，使用`待确认 + 校准问题ID`。

## 4. DUT映射

当前阶段映射到 Module 例化层，不要求逐信号映射：

```text
通路ID | Master模块例化 | 中间模块例化链 | Slave模块例化 | 依据 | 确认状态 | 校准问题ID
```

- 模块例化填写完整 HDL 层次路径。
- 空洞的 `Slave模块例化` 使用 `NONE`。
- 当前不生成 assertion 时，不维护 assertion 或逐协议字段信号映射。
- AXI→APB 内部拆包、变宽、strobe、pipeline/FIFO 等算法不进入工作簿。

## 5. 校准问题

```text
问题ID | 影响对象 | 问题内容 | 当前已知信息 | 需要确认内容 | 状态
```

`校准问题`只展示本次生成时仍未解决的问题，状态统一为`待确认`。人工确认后的结论回填到对应业务表，重新生成工作簿时删除已解决问题，并将剩余问题从 `Q_001` 开始连续编号；因此该表不是历史问题台账。未解决问题若影响 TP 对象、合法性、场景或期望行为，必须转换为 scope 或 lifecycle missing-input report；仅缺 Module 例化名称时按共享 Contract 进入 implementation TODO。

## Bach Core 当前用户确认

- Master 输入为 AXI。
- 工作簿同时维护 `SCP_CTRL` 全局地址视角和 `RV_CORE` 本地地址视角；RV Core 的 ITCM、DTCM、Shared Memory 地址分别从 `0x0000_0000`、`0x0010_0000`、`0x0020_0000` 开始。
- 所有 Slave 端协议均为 APB，数据宽度均为 32 bit。
- 所有 APB Slave 地址宽度均为 32 bit，所有通路支持的访问粒度为 4 Byte。
- 非法访问在验证事务层检查 `resp=ERROR`；ITCM/DTCM及其他超出合法容量的访问由 Slave 返回该错误。
- `vc_core_s` 与 `vu_core_s` 统一使用 `vu_core_s`。
- RV Core 使用 `rvcore2dsa` 自定义协议，地址和数据均为 32 bit；信号定义来自用户截图。
- 当前已有地址空间全部使用穷举刺激，包括DSA视角合并后的36 MiB Matrix Memory Region；若未来出现超过36 MiB的新Region，再新增规则选择。
- 当前不生成 assertion，默认使用 testcase + covergroup。
- 当前最大单个 Region 为DSA视角的Matrix Memory，容量36 MiB；SCP视角仍拆分为32 MiB data Region和4 MiB scale Region。
- 地址候选与R/W执行全交叉；非法地址同时执行R和W。
- SCP_CTRL合法读检查`RRESP=OKAY`，合法写检查`BRESP=OKAY`。
- VU/MU Dummy通路纳入Path TP范围；当前Dummy接口完整但内部功能为空，该事实写入场景或实现说明，不再作为是否纳入的校准问题。
- DTE MAS 第5章定义DTE使用32-bit全局地址区分Slave；CM使用地址低20 bit，MM使用低26 bit。
- DTE任务路径由`CFG_TRANS_MODE.transfer_mode`选择：000 Router→CM、001 Router→MM、010 CM→Router、011 MM→Router、100 Core内搬运。
- DTE任务长度以1 Byte为单位；段1～3长度必须为8 Byte整数倍，段0可承载18 Byte包头；`seg_valid`只控制段1～3，段0始终有效。
- `wr_sharemem_flag=1`时，Task完成后写一笔32-bit ShareMem flag，写完成后才允许通知TS。
- DSA视角中Matrix data/scale属于同一Region内的不同访问方式，返回有效数据位宽不同；SCP视角因地址空间明确分段，仍保留两个Region。
- DTE2内部lane、乱序和多未决调度属于ST不可见的微架构实现，不作为Path TP输入或校准问题。

## 不进入输入件的内容

- AXI→APB 内部 transaction 拆分、位宽转换算法、strobe 生成、bridge pipeline/FIFO/arbiter；
- 软件 `Sid * stride` 地址形成；
- 寄存器 field mask、side effect 和 RESERVED bit 功能语义；
- 与 Path TP 无关的微架构实现细节。

只有这些实现造成的 Master 可见合法条件、最终 Slave、数据结果或 response 才写入 `通路与地址空间`。
