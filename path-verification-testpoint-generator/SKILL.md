---
name: path-verification-testpoint-generator
description: 根据地址空间、通路/协议、DUT 映射和验证规则生成层次化通路验证 Testpoint。适用于生成系统级通路验证 TP、地址扫描 TP、操作扫描 TP、地址 × 操作交叉 TP，以及输入不足时的 Missing Input 报告。默认用中文输出；不得猜测无法唯一推导的信息。
---

# 通路验证 Testpoint 生成器

## 职责与边界

使用本 Skill 生成可映射到 DUT 的层次化 **通路验证 Testpoint**。Path TP 的验证对象是一次明确的 Master → Slave 端到端访问；配置值、软件地址计算和存储功能本身由对应功能类 TP 负责。

一个正式 Path TP 由以下语义共同确定：

- `master`：发起访问的硬件主体；
- `slave`：接收访问的硬件目标；
- `access_class`：`NORMAL`、`ILLEGAL` 或 `RESERVED`；
- `operation`：`RAW`、`READ`、`WRITE`、`ADDRESS` 或输入定义的协议操作；
- `verification_goal`：该访问在 Slave 侧及返回路径上的可观察结果。

Skill 根据地址空间、Path/Region 映射、协议操作和验证规则生成候选，完成合法性、覆盖抽样、目标映射和 Lifecycle 判断，并按 Path 与三级 TP 场景树输出。

对象按以下职责归属：

- 仅验证配置选择、模式编码或存储内容功能时，归入相应功能 TP；当输入明确给出选择值到硬件 Slave 的路由关系，且目标是观察端到端路由时，生成 Path TP。
- `Sid * stride` 等软件侧地址形成规则用于软件配置验证；Path TP 使用 Master 接口实际看到的硬件地址范围。
- 协议规范、DUT 行为、HDL 路径、典型地址、代表值和非法响应来自输入。

## 必需输入

优先直接消费`st-verification-design-analysis`生成的ST设计分析工作簿；不得要求用户把同一证据再手工复制成另一套输入。设计分析提供：

1. `接口分析`：Top通道/内部通道、Master、Slave、协议、信号、方向、位宽；用于Path边界、`sample_if`及可观察字段。
2. `Path特性`：顺序、Burst、Outstanding、反压、仲裁、响应等原子特性及`关联通路`；用于功能/性能TP及方法选择。
3. `通路与地址空间`：Path、Region、合法/非法条件、操作、粒度、响应、关联Feature和测试策略；用于建立单次访问候选。
4. 每个Module Sheet：接口、编程示例、Feature、MMIO/对象语义；主要用于非Memory目标及目标对象专项行为。
5. `存储信息`：Memory容量、Bank/Row、Master访问视图、宽度、Mask、竞争、响应和延迟；主要用于Inside Data Path。
6. `性能`：带宽、延迟、并发/并行度及适用条件；只用于有明确量化目标的性能TP。
7. `平台映射`：实现绑定；仅缺实现名时写TODO，不反向覆盖设计语义。
8. `校准问题`：未决语义及影响对象；用于Lifecycle和Missing Input。

已有 [Path TP 统一输入工作簿](references/path-tp-input-workbook.md) 的五Sheet格式继续作为兼容输入：

1. `基础信息`：输入来源，Master/Slave 名称、协议、数据宽度、地址宽度和支持操作；Custom Master 还包含生成 Path TP 所需的自定义协议信号定义。
2. `通路与地址空间`：按 Master 合并展示，一行一个 Master 视角连续地址区间；通路 ID 同时编码 Master→Slave/Region 与 legal/illegal/conditional 分类，并明确通路协议、地址、测试操作、访问粒度、非法原因和期望响应。同一 Master 对不同 Slave 使用不同接口时，每条通路分别引用对应协议。
3. `验证规则`：已确认的确定性规则，使用`规则分类/固定规则/执行要求/适用范围`表达，不使用选择题问卷。
4. `DUT映射`：通路对应的 Master Module、中间 Module 例化链和 Slave Module。
5. `校准问题`：只保留当前无法唯一确定的信息及其具体补充条件；已解决结论回填业务表后不保留历史记录，重新生成时对剩余问题连续编号。

原始设计文档、代码和用户确认必须先由设计分析Skill归一化；TP生成器只消费结构化结论，不绕过工作簿重新选择冲突来源。

## 证据驱动的Path类型判定

先判定Path类型，再选择典型TP模板；不得从某个Sheet出现了什么就直接拼TP。

| Path类型 | 判定规则 | 主要证据 | 典型功能TP |
|---|---|---|---|
| Bach Top Path（对外Path） | 激励或结果穿越`BACH_CORE_TOP`外部边界 | `接口分析.Top通道`、`通路与地址空间`、`Path特性`、`性能`、目标Module/Memory证据 | 端到端路由、合法/非法协议访问、握手与反压、顺序/响应、错误传播 |
| Bach Top Inside Data Path | Top内部Master→Memory类Slave | `接口分析.内部通道`、`通路与地址空间`、`Path特性`、`存储信息`、`性能` | 地址抽样、粒度、单次MEM读、单次MEM写、RAW、多事务并发/仲裁/反压、响应归属、非法访问 |
| Bach Top Inside Ctrl Path | Top内部Master→非Memory类Slave | `接口分析.内部通道`、`通路与地址空间`、`Path特性`、目标Module Sheet、`性能` | 合法命令/请求、参数和值域、状态/响应、触发/副作用、握手/反压、顺序、非法命令/参数/状态 |

目标类型不能唯一判定时只输出scope missing-input，不得用Path名称猜`Memory`或`Control`。寄存器/对象内部语义优先由Module TP承接；Ctrl Path TP只保留Master→Slave端到端可观察行为。

### TP提取Flow

```text
F1 识别Path对象
  直接读取通路与地址空间中的legal行，以统一通路ID建立Path主清单
  → Master→Slave、地址范围、合法操作、响应与确认状态

F2 生成Path Base TP
  读取存储对象、Path测试操作/测试策略与Module Profile，并按可扩展分支选择操作模型
  ├─ Memory且支持RW，或MMIO对象满足Access=RW且readback_defined → 一条写后读；淘汰重复读/写候选
  ├─ Function Module → 按Module Profile测试策略生成合法命令或功能触发
  ├─ 单向/其它 → 按实际方向生成；语义不足则阻塞并报告
  └─ testcase与执行结果仅在模型确定后回填，不得反向决定模型
  → 证明目标端接受请求，且发起端可观察正确完成

F2.1 Base TP一致性检查
  同一Master→Slave同时出现R和W时，检查是否属于Memory RW，或对象级Access=RW且回读语义已定义的MMIO
  → 应合并却仍存在独立读、写TP时，不得继续输出；报告具体Path、证据冲突/缺失字段和修正建议

F3 判定Path类型
  Path边界 + Slave类型
  → Top Path / Inside Data Path / Inside Ctrl Path

F4 聚合证据
  接口 + Path特性 + Module/存储 + 性能 + 校准问题
  → 当前Path证据包

F5 生成原子TP
  一条独立可激励、可判定、可覆盖的设计特性
  → 一条基础TP

F6 生成受约束交叉
  只对设计定义的地址×操作或多事务关系生成Cross
  → RAW、并发、仲裁、反压等多事务TP

F7 Lifecycle与验证映射
  语义缺失→blocked；仅实现绑定缺失→complete + TODO
  → 正式TP + Missing Input

F8 输出与回归
  Path（含Region）+ 三级场景树 + Final Gate
```

生成完整工作簿时新增并置顶`TP提取Flow`Sheet。按用户确认的阶段逐步扩展流程图，不得一次塞入尚未确认的后续步骤；流程图只保存方法说明，不保存正式TP对象。

### Path Base TP

`Path Base TP`是Path Inventory之后的第一层正式TP，用于回答“每一条合法Path是否至少能够走通一次”。它先于地址扫描、全粒度、RAW关系扩展、并发、仲裁和性能TP生成。

合法原子操作由一次完整交互定义：`Master发出合法操作 → Slave接受并完成 → Master观察到合法响应或完成行为`。先从设计分析的`通路与地址空间`直接读取`Path Profile（通路ID、Master、Slave、Path类型、Slave类型、通路协议）`，再根据Endpoint能力、对象级Access、请求/响应形式与Slave功能行为直接映射为以下`atomic_operation_model`；人工表和Flow中不展示生成器内部的`base_op`中间变量：

- `mem_read`：`slave_type == MEMORY && supports_read && !supports_write`；
- `mem_write`：`slave_type == MEMORY && supports_write && !supports_read`；
- `mem_raw`：`slave_type == MEMORY && supports_read && supports_write`；RAW包含先后两个请求，两个请求必须分别完成；
- `mmio_read`：`slave_type == MMIO && access ∈ {R, RO}`；
- `mmio_write`：`slave_type == MMIO && access ∈ {W, WO}`；
- `mmio_raw`：`slave_type == MMIO && access == RW && readback_defined`；
- `custom_req`：`slave_type ∈ {FUNCTION_MODULE, EXTERNAL_MODULE} && request_defined && no_response`；
- `custom_req_rsp`：`slave_type ∈ {FUNCTION_MODULE, EXTERNAL_MODULE} && request_defined && response_defined`。

操作选择必须先确定`目标类型`，再读取该类型对应的对象能力；不得把MMIO的`Access`规则直接套给所有Slave，也不得由case名称或Path级`RW`直接选择：

- `MEMORY`：读取存储对象的`supports_read/supports_write`。仅读→`READ`，仅写→`WRITE`，同时支持读写→默认`RAW`；
- `MMIO/CPU_REG`：逐寄存器对象读取`Access`。`R/RO`→`READ`，`W/WO`或写后不可合法回读→`WRITE`，`RW && readback_defined`→`RAW`；W1C、自清零、mask等由对象回读规则计算期望值；
- `FUNCTION_MODULE/EXTERNAL_MODULE`：读取接口请求/响应定义；无响应数据→`CUSTOM_REQ`，有响应数据→`CUSTOM_REQ_RSP`；若实际访问由MMIO寄存器承载，先按MMIO选择基础操作，再按Slave功能行为追加`_func`；
- Base TP采用“最小见证”判定：只要存在一个已确认的合法目标对象、一种可构造的合法原子操作，以及该操作可判定的完成/响应，即可生成complete Base TP；不要求目标Slave的全部对象、全部Access、全部权限和全部回读语义均已闭合。只有找不到任何这样的最小见证时，才保留一条`原子操作待确认`的blocked占位，不预生成READ/WRITE/RAW候选。

人工Flow必须把“原子操作定义”和“目标类型选择规则”分成两个独立小节：前者只解释READ/WRITE/RAW/CUSTOM的事务构成，后者才解释不同目标如何选择操作；选择规则不得覆盖或替代原子操作定义。

模型名固定使用`<slave>_<op>[_func]`：`<slave> ∈ {mem, mmio, custom}`，`<op> ∈ {read, write, raw, req, req_rsp}`；存在Slave侧附加功能行为时才追加`_func`。测试策略只提供映射证据，不进入模型名。

Base TP将「测试场景」与「Check」分开。被验Path上的请求必须使用`FRONTDOOR_*`；`BACKDOOR_*`只允许用于准备期望数据或独立观察结果，不得代替Path刺激。优先使用简短逻辑表达式：

人工Flow的场景单元格若包含两个以上有先后关系的动作，必须一行动作并用`→`表示顺序；不得用分号把准备、刺激和响应挤在同一行。

- `mem_read`：场景`BACKDOOR_WRITE(legal_addr, expected_rdata); FRONTDOOR_READ(legal_addr)`；Check`rdata == expected_rdata`；
- `mem_write`：场景`FRONTDOOR_WRITE(legal_addr, wdata)`；Check`BACKDOOR_READ(legal_addr) == wdata`；
- `mem_raw`：场景`FRONTDOOR_WRITE(legal_addr, wdata); FRONTDOOR_READ(legal_addr)`；Check`rdata == wdata`；
- `mmio_read`：`READ(legal_reg) ⇒ rdata == expected_value`；
- `mmio_write`：`WRITE(legal_reg, legal_value) ⇒ write_result == expected_completion`；
- `mmio_raw`：`WRITE(reg, value) ⇒ complete；READ(reg) ⇒ rdata == expected_readback(value)`；
- `custom_req`：`CUSTOM_REQ(legal_payload) ⇒ completion == expected_completion`；
- `custom_req_rsp`：`CUSTOM_REQ(legal_payload) ⇒ rsp == expected_rsp`。

若上述任一模型在基本访问之外还会产生设计定义的可观察功能行为，则在模型名后追加`_func`，例如`mmio_write_func`、`custom_req_func`。`has_function_effect`和具体`function_effect`必须来自接口定义或Module Profile，不得由读写方向猜测。测试策略可以作为模型选择的证据，但不得并入模型定义；`Endpoint × Operation × Function Behavior`也不得做无证据的笛卡尔积组合。

- 一个Base TP由一个Master、一个Slave和一种合法操作模型定义；非法Path不进入本层。Region只是场景中选择合法地址的输入，不默认参与Base TP身份或拆分。只有不同Region实际连接不同Slave、不同硬件通路或具有不同完成语义时才拆Base TP。
- Base TP必须先按端到端`Master + Slave + atomic_operation_model + completion_semantics`归一化，再处理内部实现分支。相同Master、相同最终Slave、相同原子操作和相同完成语义下，数据源、Region、内部入口或中间接口差异只作为场景参数（例如`source ∈ {CORE_MEM, MATRIX_MEM}`），不得拆成多条Base TP；这些内部硬件分支留到后续Inside Data Path详细TP展开。只有分支改变最终Slave、端到端完成语义或形成对Master可观察的不同合法操作时才拆Base TP。
- Slave类型优先来自设计分析的显式字段；没有独立字段时，可由`存储信息.存储对象`确定Memory。MMIO操作模型必须继续读取目标Module Profile的对象级`Access`、Master权限、响应/回读语义与Slave侧功能行为，不得由Slave名称、Path级笼统`RW`、测试策略名称或现有testcase猜测。对Base TP只需从已确认对象中选择一个满足最小见证的对象；其它对象仍有Access、权限或回读语义缺口时，转入`DETAIL_TP_GATE`和校准问题，不反向阻塞该Base TP。若一个满足条件的对象都无法唯一确定，才保留Path对象并将Base TP标记为blocked。
- 当目标Module Profile或寄存器描述给出对象的本地`offset`，Path Profile给出该Master视图的全局基址，且设计文档明确该地址窗承载该对象视图时，必须执行地址视图转换：`master_visible_addr = path_base + local_offset`。不得因为对象行的`关联支持Path`使用“本地IO访问”等名称、未逐字写出当前通路ID，就误判为缺少具体地址；但若“地址窗承载该对象视图”本身未被设计证据确认，则不得自行做基址相加。
- 当一条Path的对象级操作语义不足以确定模型时，只生成一条`原子操作待确认`的blocked占位；不得先假设`mmio_read`和`mmio_write`再拆成两条blocked TP。只有设计证据已经分别确认两个不可归一化的合法操作时，才能生成两条正式TP。
- `MEMORY`且Path支持读写时，Base TP操作唯一归一为`写后读`，不再为同一Path分别生成读、写Base TP。场景固定写为“对合法区域进行写后读操作，检查回读数据与写入数据一致。”地址和粒度只作为构造该最小合法事务的前置输入，不在Base TP场景中展开。全地址、全粒度、异粒度、部分范围以及其它RAW关系仍属于后续RAW扩展TP。Memory仅支持单向访问时按实际方向生成`读`或`写`，不得虚构写后读。
- 同一MMIO对象支持合法读写且设计定义了可判定回读语义时，归一为一条`mmio_raw` Base TP，并使用简洁的写后读场景。必须由对象级`Access=RW`与`RAW预期值/readback_defined`直接证明；Module Profile中的`raw_check`只允许用于一致性复核，不能作为唯一生成依据。只读、只写、具有不可逆副作用或回读语义不成立的MMIO保持`mmio_read`、`mmio_write`或相应`_func`模型。
- `FUNCTION_MODULE`的Base TP操作必须来自对应Module Profile的`测试策略`：将已确认的合法命令、功能触发或其它可观察操作转换成Base TP；策略缺失、TBD或无法唯一落到刺激与结果时标记blocked。只有设计分析明确给出启动任务、发命令、清状态等可观察副作用时才生成`功能触发`，普通配置写仍归`写`。
- `EXTERNAL_ENDPOINT`按设计分析明确支持的合法方向生成`读`、`写`或协议操作；不得套用Memory写后读或Function Module测试策略。
- Base TP人工表不单独展示`Check`列；使用一列`TP场景`，固定为两段富文本：第一行加粗`场景：`并写前门/后门刺激，第二行加粗`Check：`并写可观察结果。`原子操作模型`列只放短模型名，列宽按短文本设置；`TP场景`列应更宽，优先保证两行内读完。不得在场景字段堆叠粒度列表、随机策略、并发或性能条件。
- `功能触发`必须同时消费目标Module Profile中的寄存器/对象地址、合法触发值和副作用语义。触发位置和值必须确定，禁止依靠随机地址或随机数据“概率命中”触发条件；`通路与地址空间.测试操作=RW`不得覆盖Module Profile已经确认的trigger/command语义。
- 完成判据仅为：最小合法刺激可构造、目标端接受请求、发起端可观察正确完成。Memory写后读允许检查该最小闭环的返回数据；不得在本层追加全地址、全粒度、RAW关系扩展、并发或性能目标。
- `通路与地址空间`是Path身份的唯一主清单。`Path特性`、`接口分析`和Module Profile只能通过统一通路ID补充属性，不得用自由文本另建Path；出现主清单外Path时报告设计分析不一致并进入校准问题，不得由TP生成器自行新增。证据冲突或缺失时主清单中的Path对象仍保留，Base TP标记blocked并列出缺失语义。
- Base TP候选生成后必须执行R/W合并一致性检查：同一Master→Slave同时存在合法R和W时，若Slave属于Memory且支持RW，或MMIO对象满足`Access=RW && readback_defined`，结果中只能存在一条`写后读`Base TP。若仍出现独立读、写TP，必须停止正式输出并汇报是对象级Access/回读语义缺失，还是生成规则未执行；不得静默保留重复TP。
- `testcase`、回归列表与测试结果属于Base TP生成后的覆盖映射输入：它们可以证明某条已生成TP是否已实现、已执行或通过，但不得新增、删除、合并、拆分或改写原子操作模型。尤其禁止因发现名称含`raw_check`的case而把`mmio_read + mmio_write`反向合并成`mmio_raw`。
- Gate必须标明作用层级：`PATH_GATE`检查Path身份与基本接口；`BASE_TP_GATE`只检查是否存在最小合法见证；`DETAIL_TP_GATE`检查全对象、全Access、权限、副作用及异常语义的完整覆盖；`IMPLEMENT_GATE`检查testcase、checker、covergroup、assertion和HDL绑定。Detail或Implement Gate失败不得反向把已满足最小见证的Base TP标记为blocked。
- 校准问题也必须记录影响Gate。一个问题可以影响多个Gate，但必须分别说明触发条件。例如“寄存器表不完整”默认只影响`DETAIL_TP_GATE`；仅当其中不存在任何可确认合法对象时，才同时触发`BASE_TP_GATE`。
- 仅缺实现接口名时保留complete并写implementation TODO；找不到任何可构造的合法刺激、目标接受语义或完成响应时，才将Base TP标记blocked。
- 人工工作簿用独立`Path Base TP`Sheet承载，列顺序为：`Base TP ID`、`Master`、`Slave`、`操作`、`原子操作模型`、`TP场景`、`testcase`、`TP状态`、`缺失语义/校准问题`、`测试状态`、`覆盖状态`。Base TP不单独展示Region地址或输入依据；溯源由Base TP ID及Path Profile承担。`原子操作模型`保留，用于确定性生成和校验TP；刺激与Check合并到`TP场景`。`Base TP ID`使用`<master>2<slave>_base_<三位序号>`；连续相同Master/Slave必须纵向合并。`testcase`仅对连续且内容完全相同的非空区间纵向合并，不合并空白或仅名称相似的内容。
- 首页`TP提取Flow`在当前步骤下方增加`Path Base TP模型`表，至少定义对象粒度、验证目的、Slave类型分流、Memory写后读、Function Module测试策略、Lifecycle和范围边界。

## 前置输入检查

- `确认状态`只允许`已确认`、`待确认`；`待确认`必须引用具体`校准问题ID`。
- 每个 Master/Slave 对象的名称、协议、数据宽度、地址宽度和支持操作均已填写或明确进入校准问题。
- 每个通路 ID 符合 `<master>2<slave或region>_<legal|illegal|conditional>_<三位编号>`。
- 每条非标准协议通路必须通过`通路协议`引用基础信息中已有的自定义协议定义；对象表中的默认协议不能覆盖通路实际使用的接口。
- `Master`列必须与通路 ID 中的 master 一致；合并单元格读取时向下继承。
- 通路地址是 Master 接口实际可见地址，每行只表示一个连续区间。
- ST层不可观察的内部 lane、乱序、队列和多未决调度不进入Path TP输入或校准问题；只有它们改变外部可观察完成、数据或错误行为时，才记录对应外部约束。
- 同一Master→Slave下的data/scale等不同访问方式不自动拆成不同Region；仅当Master可见地址集合不连续、目标不同，或语义必须形成独立Path对象时才拆分。
- `legal` 行不得填写非法原因；`illegal` 行必须填写非法原因和期望响应；`conditional` 行必须填写合法条件和条件不成立行为。
- `支持的访问粒度`列出全部支持值，不得用最小粒度代替。
- 操作使用 `R`、`W`、`RW`；非法区间的`测试操作`表示要施加并检查错误响应的操作，不表示该区间允许访问。
- 验证规则必须是已确认的确定性规则；待确认的阈值或抽样参数必须关联校准问题，不得由生成器自行选择。
- 影响 TP 对象、合法性、场景或期望行为的未解决问题按共享 Lifecycle 处理；只缺 Module 例化名称时写 implementation TODO。
- DUT 映射以 Module 例化链为当前粒度；没有 assertion 需求时不要求逐协议字段信号映射。

## 表格预览可读性规则

- 不显示原始 JSON。
- 多值使用一行一个值的多行文本。
- 固定选择题明确同时显示可选项与工程选择。
- 未确认信息使用`待确认 + 校准问题ID`，不得使用含义不明的“部分确认”。
- `校准问题`不得显示已解决项；所有问题 ID 必须指向当前未决问题，重新生成时允许连续重编号并同步全部引用。
- 校准问题必须精确到具体 Path/协议、缺失字段和可直接回答的确认内容；不得只写“地址空间不明确”“协议语义不明确”等主题级描述。
- 正式机器字段按共享 Contract 保留；Path人工表格列名使用`TP状态`、`测试状态`、`覆盖状态`、`TP场景`、`Testcase`和`验证映射`，不展示独立`覆盖策略`列。状态值使用中文，测试/覆盖状态不得由定义状态推导。



## 生成范围与最小输入

本 Skill 支持只生成部分结果。调用时可指定 `generation_scope`；如果未指定，默认按 `full_testpoint` 理解。

| generation_scope | 最小输入 | 输出 |
|---|---|---|
| `path_base_tp` | `通路与地址空间` + `Path特性.关联通路` + 可观察完成语义 | 每条legal Path/Region一条连通性Base TP；语义不足时保留blocked占位 |
| `address_scan` | `通路与地址空间` + 地址扫描选择 | 地址候选、边界/越界/内部扫描候选 |
| `path_reachability` | `通路与地址空间` | legal / illegal / conditional 通路区间矩阵 |
| `operation_scan` | `基础信息` + `通路与地址空间` | 操作候选、访问粒度候选 |
| `address_operation_cross` | 地址候选 + 操作候选 + 固定交叉选择题 | 地址 × 操作交叉候选 |
| `illegal_behavior` | 非法 `candidate` + 通路行中的非法原因/期望响应 | 补充具体 DUT 行为目标的负向 `candidate` |
| `verification_strategy_mapping` | 已有 `candidate` + `DUTMapping` + Coverage Rule | 验证策略和 DUT signal 映射 |
| `missing_input_analysis` | 任意已有输入 | 缺失项清单、影响范围、需要补充的输入 |
| `full_testpoint` | 五个 Sheet 中与目标 TP 语义相关的信息已确认 | 正式 TP 与适用的 missing-input report |

缺少当前 `generation_scope` 的必需输入时，输出 scope missing-input report。不要因为缺少后续 scope 的输入而阻塞当前 scope 的候选生成。

### 分阶段生成规则

- 支持按 `generation_scope` 分阶段生成结果。
- 每个 `generation_scope` 只检查自身依赖的最小输入。
- 后续阶段所需输入缺失时，不得阻塞当前阶段生成。
- 当前阶段生成的 `candidate` 可以作为后续 `generation_scope` 的输入。

阶段衔接关系：

```text
通路与地址空间 + 地址扫描选择
→ address_scan

基础信息 + 通路与地址空间
→ operation_scan

Address candidate + Operation candidate + Cross Rule
→ address_operation_cross

通路行的非法原因与期望响应
→ illegal_behavior

DUT映射 + 验证方法选择
→ verification_strategy_mapping

完整输入
→ full_testpoint
```

`generation_scope` 是生成阶段控制，不是完整 TP 生命周期。

## 输出状态

正式 TP 的公共字段、Lifecycle、implementation TODO 与输出质量遵守 [Verification Testpoint Contract](../verification-testpoint-contract/SKILL.md)。正式状态只使用 `complete`、`draft`、`blocked`。

`candidate` 只是在 `address_scan`、`path_reachability`、`operation_scan`、`address_operation_cross` 等中间 scope 中传递的内部生成对象，不是正式 TP，也不得写入 `lifecycle_status`。`missing_input` 是报告，不是状态。`full_testpoint` 必须把已经成立的对象输出为正式 TP；语义不足时保留为 draft / blocked，并生成 lifecycle missing-input report。

## 生成流程

如果指定 `generation_scope`：

- 只执行该 scope 对应的生成步骤。
- 不检查后续 scope 的必需输入。
- 不因为 `full_testpoint` 所需输入缺失而阻塞当前 scope。
- `address_scan` 即使缺少 Protocol Definition、DUT Mapping，也可以输出 `candidate`。
- `full_testpoint` 必须检查完整输入。

如果未指定 `generation_scope`，按 `full_testpoint` 执行以下完整流程。

严格按以下顺序执行：

1. 读取并检查统一输入工作簿的五个 Sheet。
2. 根据地址空间定义 + 地址扫描规则生成地址候选。
3. 根据协议定义 + DUT 支持信号列表 + Path 约束 + Region 约束生成操作候选。
4. 根据交叉规则决定哪些目标需要地址 × 操作。
5. 执行约束判断，并区分合法 / 非法候选。
6. 对非法候选，从非法行为规则解析具体 DUT 行为并写入 `verification_goal`。
7. 执行覆盖率 / 抽样判断。
8. 生成 Testpoint。
9. 根据协议定义 + DUT 映射 + 验证规则完成覆盖策略映射。
10. 按 `Path（含Region）→ TP层级1 → TP层级2 → TP层级3 → Testpoint` 输出；分类节点单独占行，只有叶子行承载正式TP字段。
11. 对 draft / blocked TP 输出 lifecycle missing-input report。

## 阶段结果合并规则

后续 `generation_scope` 应优先基于已有 `candidate` 补充生成。

规则：

1. 不重新推导已有明确结果。
2. 不覆盖已有用户输入。
3. 每个阶段只负责补充自身字段。
4. 到 `full_testpoint` 时将 candidate 转换为正式 TP，并按共享 Contract 判定 complete / draft / blocked。

示例：

```text
address_scan:
生成：
- candidate ID
- 地址条件

operation_scan:
补充：
- 操作条件

illegal_behavior:
补充：
- verification_goal 中的具体 DUT 行为

verification_strategy_mapping:
补充：
- testcase / covergroup / assertion

最终：
candidate → formal TP（complete / draft / blocked）
```

## 候选生成

### 验证类别语义分流

验证类别由候选语义决定，不由候选来自哪个 Sheet 决定。`通路与地址空间`同时承载地址范围、Path 成立条件和测试操作；生成器不得把该 Sheet 的所有 legal / illegal 行一律归入地址类。

正式 Path TP 使用以下三个顶层验证类别：

```text
合法访问
非法访问
通路特性
```

- `合法访问`下按`地址合法｜...`与`操作合法｜...`划分子类别。
- `非法访问`下按`地址非法｜...`与`操作非法｜...`划分子类别；仅生成正常接口可达且非法行为语义已成立的对象。
- `通路特性`承载该Master→Slave接口独有的并发、仲裁、反压、响应顺序、流控或其它协议行为；不得硬塞入地址、粒度或RAW类别。
- `transfer_mode`、目标 Segment 使能等共享配置条件若已由模块配置验证或异常 TP 承接，不得在每条 Path 中重复生成；Path TP仅把合法配置作为前置条件引用。当前不存在独立 Module TP 时，也不得为了安置这些条件而重新创建 Module TP，应登记到未来异常 TP 输入清单。
- 只有配置条件本身具有该 Master→Slave Path 独有的路由选择语义，且没有共享 TP 承接时，才允许在该 Path 中生成一条参数化的配置有效性 TP。
- 同一输入行混合地址越界、访问粒度、对齐、模式或使能等独立失败原因时，不得生成笼统 TP；必须按独立条件拆分，不能唯一拆分时保留 draft 并输出 Missing Input。
- `测试操作=RW`不自动生成两条 TP。READ 与 WRITE 的条件、预期行为和验证方法相同时，生成一条 `READ/WRITE` TP，并在 coverage 中分别记录 operation；任一项不同才拆分。

### 通路特性生成

设计分析中的每条归一化Path特性默认生成一条`通路特性`TP，前提是它具有独立刺激、独立预期和独立覆盖语义。不得机械地按原始文档行数生成：同一来源行若包含多个可独立判定的行为必须先拆成多个Feature；多个来源行若描述同一Feature则合并证据后只生成一条TP。特性存在关键未确认项时保留TP并标记blocked，进入Missing Input。

### 地址候选生成

地址候选只能由地址空间定义 + 地址扫描规则生成。使用以下固定中文分类层级：

```text
合法访问
└── 地址合法
    ├── 穷举
    └── 抽样
非法访问
└── 地址非法
    ├── 起始地址低于下边界
    ├── 起始地址高于上边界
    ├── 地址空间空洞
    ├── 地址未按访问粒度对齐
    └── 起始地址合法但访问范围越界
```

单个连续合法地址空间`≤4KB`时穷举全部满足对齐要求的地址；`>4KB`时使用确定性定向集合：下边界、按该Path最小实际访问footprint与对齐规则计算的上边界合法起始地址，以及覆盖全部可识别硬件Bank的代表地址。典型地址和随机地址不作为默认TP场景；只有输入验证规则明确要求时才追加。存在Bank但缺少Master视角地址到Bank的选择公式时，Bank代表地址保持blocked并输出Missing Input，不得因Bank数量已知就猜地址。非法区间默认抽样，并对每个样本执行R/W错误行为检查。边界已内建于扫描集合，不再生成独立的“是否检查边界”配置。

生成任何非法地址 TP 前必须先判断 stimulus 可达性：若 Master 能通过正常可编程接口自然发出范围外、空洞、未对齐或尾部跨界请求，则可生成 Path 非法地址 TP；若只能通过非法配置、内部 force 或破坏协议产生，则分流到异常/鲁棒性 TP；若硬件结构上无法产生，则不生成。输入不足以判断时，只输出 Missing Input，不得先创建正式 Path TP。

用户明确要求暂缓展开非法访问时，在对应Path下保留一条`非法访问｜待展开`阻塞占位行，并以浅红底标识；占位行只记录待闭合范围，不得伪造具体非法TP。后续证据充分时用正式非法TP替换该占位行。

地址空间阈值只决定 stimulus candidate 使用穷举还是抽样，不决定 coverage bins 如何表达。地址 TP 只定义地址样本及其地址场景；访问粒度和READ/WRITE属于操作合法/非法子类别。操作 TP 按穷举或边界+随机规则覆盖支持粒度，并验证输入协议定义的地址对齐关系与`访问末地址 <= RegionEnd`；不要求地址×粒度无差别全交叉。

`地址合法｜抽样`只列地址及其场景标签：下边界、按该Path最小实际访问footprint和对齐规则计算的上边界合法起始地址、可识别 Bank 代表地址。不得在该场景中堆入 size/LEN、mode、enable、握手或完整合法 transaction 条件，也不得默认追加典型地址或随机地址。

合法地址 TP、合法 READ/WRITE TP 与合法访问粒度 TP 是三个覆盖对象，但可以并应优先引用同一个 Testcase：同一 case 在合法地址样本上执行合法 READ/WRITE，并以最小充分组合覆盖全部支持粒度；不得因此把三类 TP 合成一行。

- 对齐关系必须来自输入协议，不得对所有协议统一假设`addr % size == 0`。协议没有 size 字段时，使用其真实的 LEN、固定宽度或其它粒度字段表达，不得虚构 size 信号。
- 地址抽样中的每个具体地址必须注明覆盖场景；只写`addr=a/b/c/d`而不说明下边界、上边界或Bank语义不合格。

### 操作候选生成

操作候选由协议定义 + DUT 支持信号列表 + Path 约束 + Region 约束生成。使用以下固定中文分类层级：

```text
合法访问
└── 操作合法
    ├── 访问粒度
    └── RAW综合交叉
非法访问
└── 操作非法
    ├── 非法 Path 模式
    ├── 目标未使能
    ├── 不支持的 READ / WRITE
    └── 其他非地址操作约束不成立
```

操作约束结构：

```text
操作约束
├── 约束 ID
├── 约束名称
├── 字段
├── 合法条件
└── 非法行为
```

只维护合法条件。非法条件由 `Illegal Condition = NOT(Legal Condition)` 自动得到。不要单独维护非法条件列表。

支持`RW`的Inside Data Path默认分别生成`地址合法｜抽样/穷举`、`操作合法｜访问粒度`、`操作合法｜MEM读`和`操作合法｜MEM写`四类基础TP。MEM读证明合法读请求/响应及数据返回能力；MEM写证明合法写请求能到达目标接口且地址、数据和Mask保持一致。RAW是多事务受约束Cross，不能替代基础R/W，也不放在“单次合法访问”下。

合法读写按目标对象类型泛化：

- Memory / SRAM / RAM Path分别建立基础MEM读、基础MEM写和RAW。RAW只验证跨transaction数据一致性及关系Cross，至少覆盖：读范围等于写范围，以及读范围为写范围内的真子集；不生成读范围超出写范围的组合。
- 地址抽样与访问粒度可被MEM读、MEM写及RAW共同引用，但Testcase按目标职责拆分：基础读使用预置数据后读取；基础写在目标接口观察地址/数据/Mask；RAW执行同粒度与异粒度写后读组合。不得为了减少行数把三种方法压成同一个场景。
- IO / MMIO / Register Path 默认使用独立的合法READ与合法WRITE能力表达，不强制RAW；只读、只写、side effect、field mask和RESERVED语义由对应寄存器/模块输入决定。
- 目标类型不能唯一判断时不得猜测RAW，输出Missing Input。

有限编码宽度的合法粒度域必须写清上下界与步进。候选数量较少时穷举；大规模等差域使用`下边界 + 上边界 + 中间随机合法值`，不得要求逐值覆盖。例如16-bit LEN且要求8B步进时，若`0`表示Segment未参与，则访问粒度覆盖写为：下边界8B、上边界65528B、中间随机`8×N`且`N∈[2,8190]`；`0`不作为0 Byte搬移粒度。长度计数单位仅用于解释编码换算时保留，不作为独立覆盖类别。

如果某个约束依赖目标 Path 不支持的协议字段，则不要为该约束生成 TP；如果用户请求的类别需要它，则输出 Missing Input。

## 地址 × 操作交叉

地址候选和操作候选必须独立生成。只有交叉规则指定的验证目标才执行地址 × 操作。

示例：

- 内部地址扫描 → 地址，并保证选中粒度下对齐且访问范围合法。
- 起始地址越界 → 地址。
- 访问范围越界 → 地址 × 访问粒度。
- 地址对齐 → 地址 × 访问粒度。
- Path 模式、目标使能 → 地址已合法时的操作条件，不归入地址类别。

交叉后的 Condition 形式：

```text
<address_expression> && <operation_expression>
```

## 约束判断

对每个候选：

1. 判断地址约束、Path 约束、Region 约束和操作约束。
2. 分类为合法或非法。
3. 对非法候选，通过非法行为规则解析 `verification_goal` 中的具体 DUT 行为。
4. 如果 Illegal Behavior 缺失或过于抽象，保留 draft TP 并输出 lifecycle missing-input report。

`verification_goal` 必须包含具体 DUT 行为，例如：

```text
RRESP == DECERR
```

不得输出抽象行为，例如：

```text
访问失败
```

## 覆盖率 / 抽样

按以下顺序处理：

```text
候选域
→ 检查现有覆盖点覆盖情况
→ 如果已覆盖：不额外生成代表候选
→ 如果未覆盖：根据抽样规则选择代表候选
```

不得猜测代表值。如果抽样规则缺失，必须对受影响的候选域输出 Missing Input。

## 验证点生成

正式 TP 使用共享 Contract 的核心语义字段；Path人工表格不展示独立`coverage_strategy`列，覆盖采样语义统一写入`coverage_strategy_mapping`。Path、Region和内部语义分类由展示树唯一定位，不在 TP 行重复保存。

TP ID 基于输入通路 ID 生成：

```text
<通路ID>_tp<3-digit-number>
```

示例：

```text
scp_ctrl2dte_itcm_legal_001_tp001
```

READ/WRITE、地址条件和非法原因写入 `verification_scenario`，不继续堆入 ID。

Master、Slave、正常/异常分类和操作必须进入 TP ID。每条 TP 只对应一个 Master → Slave 关系；多个 Slave 分别生成 TP。Path 和 Region 已由`Path（含Region）`单元格表达，不重复为独立字段。

正常Memory可读写访问按共享 [Access RAW Contract](../verification-testpoint-contract/references/access-raw.md) 生成一个 RAW goal。Path 本地只验证写请求到达目标、读请求从同一目标返回以及 rdata 与该安全目标的已知访问语义一致；寄存器 field mask、RESERVED 位和 side effect 仍由 Register Access TP 验证。安全对象、数据宽度或 expected rdata 不能唯一确定时，RAW TP 按共享 Lifecycle 标记为 blocked。

`verification_scenario` 示例：

```text
ARADDR == 32'h1FFF
ARADDR == 32'h1FFC && ARSIZE == 3 && READ
```

`verification_scenario` 表达访问如何成立，`verification_goal` 表达 DUT 对该访问的结果。`NORMAL` TP 写明 Master、Slave、operation 及适用的正常访问条件；`ILLEGAL` / `RESERVED` TP 还必须写明触发非法分类的具体规则，例如访问非本 Master 所属的 Slave、地址越界、权限不满足或命中保留空间。TP_ID 中的 access class 只用于定位，不能代替场景内容。非法原因不能由输入唯一确定时，TP 保持 draft 并进入 lifecycle missing-input report。

`coverage_strategy` 写实际 method 或 category-specific structured coverage；不使用旧 `Target` / `验证策略` 字段。method 可以包含以下一个或多个：

- `testcase`：测试构造方法。
- `covergroup`：结构化 coverage method。
- `assertion`：时序或行为检查方法。

具体 testcase、coverpoint 或 assertion 名称只写入 `coverage_strategy_mapping`。仅缺这些 implementation binding 时，TP 保持 complete 并写共享 Contract 规定的 TODO。

## 验证映射

Path TP 的`验证映射`必须映射到该 Master→Slave 的真实接口，并根据TP语义选择`covergroup`、`assertion`、`cover property`或`scoreboard`。

- `sample_if`：设计分析中的接口ID与接口名，例如`DTE_IF_009（dte2cm）`；
- `cover_event`：采样条件，必须说明何时一次请求/响应被视为有效样本；
- `cover_value`：本TP实际采样的接口字段或可由接口字段唯一还原的值。

合法地址、粒度和RAW输入空间使用covergroup；时序、握手、稳定性、反压隔离等局部不变量使用assertion，并配cover property证明前件场景真实发生；跨多请求的响应归属、顺序和数据结果优先使用scoreboard，必要时追加局部assertion。`cover_value`或assertion中的每个逻辑表达式必须直接引用`sample_if`信号，不得使用与接口脱钩的抽象变量或自然语言标签。

## 输出结构

生成完整工作簿时，最后一张 Sheet 固定命名为`Gate检查`，不得再使用`生成说明`。该 Sheet 必须逐条记录本次生成实际启用的所有 Gate，至少包含：`Gate ID`、`阶段`、`检查对象`、`Gate规则`、`通过条件`、`失败处理`、`阻断正式输出`。Gate 清单是可执行检查表，不是方法说明；任何会阻断正式 TP 的规则都必须明确失败后的校准、Missing Input、Lifecycle 或停止输出动作。

Testpoint 文件使用以下层级：

```text
通路验证 Testpoints
└── Path（含Region）
    └── TP层级1
        └── TP层级2
            └── TP层级3
                └── Testpoint
```

固定原则：

- Region不单独占列；Path单元格固定写为`<Path>\n（<Region地址范围及容量>）`。
- 同一Path存在多个Region时，每个`Path + Region`组合形成独立纵向合并块。
- `TP层级1/2/3`是展示树，不是三个业务字段；使用`1`、`1.1`、`1.1.1`形式的简单编号表示父子关系。
- 每个层级节点单独占一行，并分别写入对应层级列形成视觉缩进；父节点行不填写TP_ID、TP场景、Testcase、验证映射、状态或执行结果。
- 只有最末级叶子行承载正式TP；若某分支只需两级，可在第二级直接放叶子，不为凑满三级增加空语义节点。
- 不同 Path 使用统一分类框架。
- 某些 Path 可以因为能力不同而缺少某些分类或 TP。
- TP 自身不保存 Path、Region 或 Category 字段。
- 表格展示中只纵向合并连续相同的`Path（含Region）`与确实共用的Testcase；层级节点通过独立行表达，不再合并成`验证类别/子类别`列。

默认场景树为：

```text
1 通路功能特性
├── 1.1 单次合法访问
├── 1.2 单次非法访问
├── 1.3 多事务访问
└── 1.4 响应与顺序
2 通路性能特性
```

地址抽样、访问粒度、基础R/W或合法命令放在`1.1`下；非法访问对象放在`1.2`下；RAW、连续流量、并发、仲裁和反压放在`1.3`下；响应归属与顺序放在`1.4`下。性能上限、峰值吞吐、精确最大Outstanding或延迟指标放在`2`下，不与可自适应验证的功能正确性混为一类。输入不支持某节点时省略该分支。

中文表格列顺序固定为：

```text
Path（含Region）
TP层级1
TP层级2
TP层级3
TP_ID
TP场景
Testcase
验证映射
输入依据
缺失语义/校准问题
TP状态
测试状态
覆盖状态
```

`TP场景`合并 canonical `verification_scenario` 与不可丢失的 `verification_goal`：先写刺激/条件，再按需写`预期：`或`覆盖：`。若 goal 与场景已经同义，不重复追加。`Testcase`独立保存测试构造方法；covergroup、assertion和scoreboard绑定统一在`验证映射`中表达。

业务上的`合法/非法`、`地址/操作`和`通路特性`仍用于候选语义判断，但人工表不再用`验证类别/子类别`两列硬编码；它们映射到上述三级场景树。树深超过三级时合并相邻的非叶语义名称，不增加`TP层级4`。

## 输入缺失机制

当信息无法唯一推导时：

1. 不得猜测。
2. 已经成立但关键输入缺失、无法闭合场景/预期/接口覆盖映射的正式 TP 必须为 blocked；draft 只用于输入已足够、但人工内容尚未整理完成的状态。只有对象本身尚未成立时不生成 TP。
3. 对 draft / blocked TP 按共享 Contract 输出 lifecycle missing-input report；对象尚未成立时输出 scope missing-input report：

```yaml
lifecycle_missing_input_report:
  - affected_tp_id: <TP_ID>
    lifecycle_status: <draft | blocked>
    missing_content: <缺失内容>
    completion_or_unblock_condition: <补充条件>

scope_missing_input_report:
  - missing_content: <对象成立所缺内容>
    affected_scope: <Path / Region / TP层级节点>
    required_input: <需要补充的输入>
```

如果存在统一规则，直接引用统一规则。如果不存在统一规则或特定规则，则报告 Missing Input。

## 地址输出契约

Master 接口硬件可见地址的集合、边界、典型值、越界空间与 bins 表达遵守共享 [Address Coverage Contract](../verification-testpoint-contract/references/address-coverage.md)。Path 本地规则只补充 Region 可达性、路由、访问宽度、对齐、协议操作及响应语义。

## 禁止猜测规则

不得猜测：

- 由通路 ID 或 Region 名称猜测 Module 例化路径。
- 由标准协议定义猜测 DUT 实际支持的操作或访问粒度。
- 输入资料定义的 DUT 地址语义。
- 代表候选。
- Illegal Behavior。
- 验证策略类型。
- 由 software access 成功推导完整 DUT 行为。

只生成能由统一输入工作簿唯一推导的内容。

## Final Gate

交付前额外确认：

- 内部语义仍能区分`合法访问`、`非法访问`和`通路特性`；人工表已映射为`通路功能特性/通路性能特性`及其三级场景树，未继续暴露含义重叠的`验证类别/子类别`列。
- 地址TP只表达Region、地址样本及其地址场景；粒度和READ/WRITE能力归操作子类别。地址对齐和范围合法性作为地址样本可执行的约束参与交叉。
- Inside Data Path已分别生成基础MEM读、基础MEM写和独立访问粒度TP；RAW综合交叉位于`多事务访问`，引用地址样本、写粒度、读粒度、Lane与Mask，并约束读字节集合包含于写字节集合，未用RAW替代基础R/W。
- RAW必须命中读写范围完全相等，并覆盖读范围为写范围内真子集；不得生成读范围超出写范围的组合。
- 场景使用协议真实的 size、LEN、固定宽度或步进字段；未统一假设`addr % size == 0`，也未虚构协议字段。
- RAW作为多事务关系TP存在；具体写后读步骤和数据模式仍只写入Testcase/check，不扩展成重复分类节点。
- 默认未生成典型地址或随机地址；存在Bank但缺少地址到Bank选择公式时已保持draft并进入Missing Input。
- 混合多个独立失败原因的输入未被直接生成笼统 TP；已拆分或进入 Missing Input。
- Inside Data Path的基础MEM读与MEM写固定分开；其它Path仅在读写条件、预期行为或方法不同时拆分。
- Region已按`<Path>\n（<Region地址范围及容量>）`合入Path；连续相同的`Path + Region`已纵向合并，未保留独立Region列。
- 层级节点各占一行并写在对应的`TP层级1/2/3`列；父节点行无TP字段和状态，只有叶子行承载正式TP。
- 中文展示使用固定列顺序与中文状态映射；`TP状态`、`测试状态`、`覆盖状态`职责独立，默认未执行的TP没有被误标为已测试或已覆盖。
- `验证映射`已落到真实Path接口，并按语义选择covergroup、assertion/cover property或scoreboard；表格不存在独立`覆盖策略`列。
- 存在关键输入缺失且无法闭合场景、预期或覆盖映射的TP已标记为`阻塞`，未滥用`草稿`。

## 调用方式

当用户说：

```text
使用 Path Verification Testpoint Generator 生成通路验证 TP
```

或：

```text
使用通路验证 Testpoint 生成器生成 TP
```

要求用户提供或生成符合 [Path TP 统一输入工作簿](references/path-tp-input-workbook.md) 的五个 Sheet，并先处理会影响目标 TP 的校准问题。

然后生成：

- 层次化通路验证 Testpoint 文件。
- 若有 TP 被阻塞，则生成 Missing Input 报告。
