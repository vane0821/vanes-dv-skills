# Development Log

## 2026-10-13 | Simplify Unified Workbook to TP-Relevant Information

### Problem

首版统一工作簿把证据、协议转换、地址转换、Region partition 和操作约束分别建表，超出了 Path TP 需要维护的最小信息，并把 AXI→APB 内部实现细节误当成 TP 输入。

### Root Cause

输入模型偏向通用数据库归一化，没有以“是否改变 TP 对象、场景或可观察结果”为字段和拆表边界。

### Change

人工表名统一改为中文；来源信息并入各业务行；Region 与 partition 合并为一张按连续区间维护的 `地址区域` 表；删除独立协议转换、地址转换和操作约束表；合法条件并入 `通路定义` 与 `地址区域`；行为规则只保存验证端可观察结果，并支持全局/通路/区域/区间绑定。

### Preserved Behavior

四类机器输入边界、Master → Slave 对象、decoder window 与有效容量区分、多 Path 可达性、地址/操作候选、cross、非法行为、Lifecycle、DUT implementation TODO 和输出结构保持不变。

### Validation

工作簿仍能表达多 Path、禁止/条件访问、内部空洞、协议约束和具体 expected behavior；AXI→APB 内部机制被移除，但其造成的外部合法性限制和 Master 可观察 response 仍可表达。当前 Bach Core 来源映射已同步到简化后的中文表。

### Pending

生成脚本尚未实现统一工作簿转换；APB target 对 AXI 请求的外部合法性与 Master 侧 Error 编码仍待项目输入确认。

## 2026-10-13 | Unified Human-Maintained Input Workbook

### Problem

四类机器输入适合生成器消费，但项目事实分散在 NoC Base、架构文档、画板、共享地址宏和参考模型中，人工无法在一个位置维护来源优先级、decoder window、有效容量、协议转换与未决冲突。

### Root Cause

现有输入模型只定义机器输入分类，没有定义人工 source of truth 的表粒度、证据追踪和校准闭环；Region 也缺少显式 partition 表达，容易把 decoder window 误当成全部合法容量。

### Change

新增统一输入工作簿规范：一个工作簿内按设计事实、验证决策和实现绑定分表维护，并确定性转换为原四类机器输入；新增 SourceEvidence、RegionPartition、ProtocolConversion、AddressTranslation 和 CalibrationIssue 的人工维护职责，并映射当前 Bach Core 输入来源与已知冲突。

### Preserved Behavior

Master → Slave Path 对象、四类机器输入边界、generation scope、candidate/正式 TP 区分、Lifecycle、输出层级、地址扫描、操作扫描、cross、非法行为和覆盖策略规则均保持不变。

### Validation

统一工作簿没有替代四类机器输入；decoder window 与真实容量可独立表达；不同地址视角和软件地址形成规则不再混入 Master 可见 Region；open calibration issue 会进入 missing-input，不允许导入器猜测。

### Pending

生成脚本尚未实现统一工作簿到四类机器输入的转换，也尚未完整实现现有 generation scope。

## 2026-09-20 | Shared TP Contract Migration

### Intended Delta

将正式 TP 迁移到共享字段与 `complete / draft / blocked` Lifecycle；candidate 仅作为内部阶段对象；地址 partition 引用共享 Address Coverage Contract；不完整但对象成立的 TP 保留并报告缺口。

### Preserved Behavior

Path / Region 层级、地址与操作候选生成、可达性、对齐、协议响应、DUT mapping 和 generation scope 保持不变。

### Affected Rule Set

正式输出状态、字段职责、地址规则、missing-input、输出 schema、模板、generator 与 push adapter。

### Semantic Diff

旧 `complete_tp` 变为 `complete`；旧 candidate 不再进入正式 TP；缺少行为语义的已成立 TP 变为 draft，不再使用“符合预期”补齐；旧表字段仅由 push adapter 做边界映射。

### Regression Gate

正文、schema、模板和生成脚本均使用共享字段；push adapter 可把新字段写入现有存储列；业务 Path 规则未被共享 Contract 覆盖。

## 2026-09-20 | Remove Legacy Formal TP Model

### Problem

正文后半段和 Base 输出仍以 Condition、Expected Behavior、verification strategy、status 及“不完整就不生成”定义正式 TP，与共享 Contract 和已迁移的 schema / generator 冲突。

### Root Cause

上一轮只迁移了状态章节、schema 和 generator，未完成字段在 input check、stage merge、constraint、mapping、Base setup 与 push 的 Impact Closure。

### Change

正式 Path TP 统一使用 `TP_ID`、`lifecycle_status`、`verification_scenario`、`verification_goal`、`coverage_strategy`、`coverage_strategy_mapping`；对象已成立但语义缺失时保留 draft / blocked；Base setup 与 seed 使用新字段，push 对既有旧列名表保留边界兼容。

### Preserved Behavior

candidate 分阶段机制、Path / Region / Category 层级、地址与操作候选、cross、非法行为输入、DUT mapping 和 generation scope 保持不变。

### Validation

旧正式字段与“不完整 TP 不生成”规则已从权威正文移除；schema、模板、generator、Base setup 与 regression 使用同一正式模型，push 的旧列名适配仅存在于存储边界。地址候选阈值冲突未在本 change 修改。

### Pending

区分 Path candidate sampling threshold 与共享 Address Coverage partition threshold。

## 2026-09-20 | Separate Address Sampling and Bin Thresholds

### Problem

Path 的 1000-candidate threshold 与共享地址契约的 64-value threshold 都被描述为地址空间大小阈值，职责不清。

### Root Cause

stimulus candidate selection 与 coverage partition expression 使用了相似的 size / threshold 术语，没有明确两个阶段的输入和产出。

### Change

`address_stimulus_sampling_threshold = 1000` 只决定 exhaustive 或 sampled stimulus candidates；`coverage_bin_expansion_limit = 64` 只决定 bins 逐值或范围表达。Path QA、schema、模板、pull、generator、setup、seed 与 README 使用 stimulus-specific 名称；旧 `threshold_candidates` 仅保留读取兼容。

### Preserved Behavior

两个数值、candidate count 计算、现有 exhaustive / Typical Address 策略、共享地址 bins 规则均不改变。

### Validation

正文和工具链不再把 1000 用作 coverage threshold，也不把 64 用作 stimulus sampling threshold；Observed Behavior Change 仅为字段命名与职责澄清。

### Pending

无。

## 2026-09-20 | Master-to-Slave Path Model and Shared RAW

### Problem

旧 TP_ID 只表达 Path 名，正常/异常、Master、Slave 与读写操作无法从 TP 本身识别；正常访问也没有统一 RAW 表达。软件地址形成和存储功能同时混入 Path 对象。

### Root Cause

Path 的核心对象仍以候选生成流程定义，未把端到端访问的必要语义作为正式 TP 身份；RAW 模式只存在于 Module Register Access 本地。

### Change

正式 Path TP 统一为 Master → Slave + access class + operation + end-to-end goal；TP_ID 使用 `<MASTER>_TO_<SLAVE>_<ACCESS_CLASS>_<OPERATION>_<NNN>`。RAW 模式提升到共享 Access RAW Contract，Module 和 Path 分别保留自己的 expected rdata 语义。软件地址换算与纯存储功能从 Path 对象中分流，地址覆盖只接受 Master 接口硬件可见范围。

### Preserved Behavior

Path / Region / Category 层级、地址候选、操作候选、cross、非法行为、覆盖抽样、DUT mapping、Lifecycle 与 generation scope 保持不变。

### Validation

共享契约、Module 引用、Path 正文、schema、模板、generator 与 regression 使用同一模型；公共 RAW 模式仅在共享契约定义。Observed Behavior Change 仅限 TP 身份、RAW 复用和对象分流。

### Pending

无。
# 2026-10-13 | Freeze Human Input Workbook v1

- **Problem**：旧输入模型把 Path、Region、映射和自由问答拆成多套表，字段重复，`部分确认`无法指出具体缺失，且 DUT 映射粒度超过当前 TP 所需。
- **Root Cause**：机器规范化对象直接暴露给人工维护，没有以 Master 视角的端到端连续地址区间作为唯一事实对象。
- **Change**：统一为五个中文 Sheet；用紧凑通路 ID 编码 A2B/Region 与 legal/illegal/conditional；非法原因和期望响应保留在通路行；验证规则改为固定有限选择题；DUT 映射收敛到 Module 例化链；状态只保留已确认/待确认并强制引用校准问题。
- **Preserved Behavior**：保留小空间穷举、大空间抽样、地址与操作候选、非法行为具体化、分阶段生成、Lifecycle/Missing Input 和 testcase/covergroup 能力。
- **Validation**：Bach Core v1 工作簿已生成并完成五个 Sheet 的结构及视觉检查；所有 APB Slave 按用户确认统一为 32-bit 数据宽度。
- **Pending**：访问粒度、Error 编码、大空间抽样选项、交叉规则和 Module 例化链仍待工程确认。

# 2026-10-13 | Add Explicit Master Views

- **Problem**：通路表只依赖 ID 隐含 Master，无法直观看出每个 Master 有多少条通路，且首版遗漏设计文档中的 RV Core 本地地址视角。
- **Root Cause**：为减少重复字段过度压缩了人工视图，导致分组可读性和多 Master 完整性下降。
- **Change**：通路表新增并纵向合并 `Master` 列；补充 RV Core 的 ITCM、DTCM、Shared Memory 本地地址区间；基础信息加入 RV Core Master；来源第 10 行改为分号分隔并换行。
- **Preserved Behavior**：通路 ID 仍编码 A2B/Region 与 legal/illegal/conditional；地址仍是一行一个连续区间；所有 APB Slave 仍为 32-bit。
- **Validation**：结构校验同时检查 29 条通路、RV Core 分组以及全部 APB Slave 数据宽度。
- **Pending**：RV Core 接口协议、数据宽度和 Module 例化仍待确认。

# 2026-10-13 | Calibrate Access and RV Custom Protocol

- **Problem**：访问粒度、错误响应、APB地址宽度、VU命名和RV Core协议仍以宽泛问题存在，影响 TP 生成。
- **Root Cause**：用户确认和接口截图尚未回填到唯一结构化证据。
- **Change**：统一4 Byte访问粒度、`resp=ERROR`、APB 32-bit地址宽度和`vu_core_s`命名；基础信息增加`rvcore2dsa`自定义协议信号区；最大Region明确为32 MiB；多粒度交叉自动关闭。
- **Preserved Behavior**：大空间抽样方式、地址×R/W范围、正常响应语义和Module例化链仍保持待确认，不做猜测。
- **Validation**：工作簿结构校验覆盖APB宽度、29条通路和自定义协议区；已解决问题不再挂在通路行。
- **Pending**：Q_005、Q_006、Q_008、Q_010。

# 2026-10-13 | Regenerate Current Calibration Questions

- **Problem**：校准问题表同时显示已解决项与未决项，容易让使用者误以为已经确认的内容仍需处理。
- **Root Cause**：把当前输入件误作问题历史台账，保留了旧问题编号和解决状态。
- **Change**：校准问题表只保留当前未决项；已解决结论仅固化在对应业务表；剩余四项重新连续编号为 Q_001～Q_004，并同步通路、规则与 DUT 映射引用。
- **Preserved Behavior**：四个未决语义、大空间抽样、地址×R/W交叉、正常响应语义和 Module 例化链需求保持不变。
- **Validation**：构建校验要求问题编号连续、状态全部为待确认，且所有问题引用均指向当前问题集合。
- **Pending**：Q_001～Q_004。

# 2026-10-13 | Add Internal DSA Paths and Path Protocols

- **Problem**：基础信息只有 `rvcore2dsa` 入口协议，无法描述 DTE/VU/MU DSA 到 CoreMem、MatrixMem、ShareMem 等内部目标的真实接口。
- **Root Cause**：对象级协议被误当成所有出向 Path 的统一协议，未表达同一 Master 面向不同 Slave 使用不同接口。
- **Change**：仅依据 `bach_core_top.v` 新增6条结构通路、DSA Master对象、`dte2cm/dte2mm/dte2sm/dte2mu/vu2cm/mu2cm`协议定义，并在通路表新增`通路协议`列；Top已证明的实例链直接回填DUT映射。
- **Preserved Behavior**：原29条地址通路、既有校准问题、扫描规则及4 Byte结论保持不变。
- **Validation**：校验35条通路、7组自定义协议、连续问题编号以及通路协议和校准问题引用。
- **Pending**：新增内部通路的地址范围、协议语义和Dummy启用范围待确认。

# 2026-10-13 | Calibrate DTE Paths from MAS Chapter 5

- **Problem**：DTE_DSA对象仍显示“按通路协议”，DTE→CM/MM/SM只有结构连接，没有任务级地址与路径选择语义。
- **Root Cause**：Top只能证明连线，尚未合并DTE MAS编程模型中的全局地址、transfer_mode、seg_valid、长度与异常规则。
- **Change**：新增DTE MAS第5章来源；DTE对象明确32-bit全局地址和32/2048-bit数据接口；补齐DTE→CM、MM data、MM scale、ShareMem地址区间、模式条件、长度/对齐及正常目标；Matrix拆为两个连续Region。
- **Preserved Behavior**：Top提取的握手信号、DTE→MU结构候选、VU/MU内部候选、原扫描与交叉规则保持不变。
- **Validation**：校验36条通路，强制检查4类已校准DTE通路均具有地址范围与合法条件，且DTE对象不再使用占位宽度。
- **Pending**：内部握手/双lane/返回匹配、DTE→MU与VU/MU地址，以及Dummy启用范围仍待确认。

# 2026-10-13 | Resolve Scan, Cross, Response and Dummy Scope Decisions

- **Problem**：32 MiB扫描、地址×操作交叉、正常AXI响应和Dummy是否纳入仍作为问题存在；剩余地址/协议问题范围过宽，工程师无法直接回答。
- **Root Cause**：验证决策未及时固化，校准问题按主题汇总而没有精确到具体Path、信号和缺失字段。
- **Change**：全部现有Region（含32 MiB）改为穷举；合法地址×R/W全交叉，非法地址执行RW；SCP合法访问检查RRESP/BRESP=OKAY；Dummy Path确认纳入且接口完整、内部为空。剩余问题重新编号并拆分为具体Path地址问题、DTE双lane问题、DTE返回/异常问题和VU/MU协议问题。
- **Preserved Behavior**：36条Path、DTE MAS地址/模式语义、现有DUT映射和testcase+covergroup策略保持不变。
- **Validation**：校验扫描/交叉选择、SCP合法响应、问题引用及当前问题集合。
- **Pending**：既有通路实例链、DTE→MU/VU→CM/MU→CM地址、双lane与返回匹配语义。

# 2026-10-13 | Align DSA Regions with ST Observability

- **Problem**：DTE Matrix data/scale被按SCP地址分段拆成两条DSA Path，校准问题同时暴露了ST层不可见的lane、乱序和多未决调度。
- **Root Cause**：地址Region沿用了SCP观察视角，并把Top端口形态误当成ST级协议语义。
- **Change**：DSA视角合并为一条36 MiB Matrix Memory Path，data/scale改为同一Region内的不同访问方式；保留访问方式选择字段和返回有效位宽问题；协议问题只询问ST可观察完成、成功判据及错误映射。
- **Preserved Behavior**：SCP视角仍保留32 MiB data与4 MiB scale两个Region；全地址穷举、地址×RW全交叉、Dummy纳入及既有DUT映射不变。
- **Validation**：校验35条Path，禁止DSA Matrix data/scale拆分，并禁止校准问题出现lane、乱序、未决请求或内部返回顺序语义。
- **Pending**：DTE→MU/VU→CM/MU→CM地址、data/scale访问方式选择与有效位宽，以及各自ST可观察完成/错误判据。
## 2026-11-02 | Separate Address and Operation Correctness

- **Problem**：生成器把`通路与地址空间`中的模式、Segment使能、长度和对齐条件全部归为“地址映射正确性”，并把`RW`机械拆成重复的READ/WRITE TP；表格只合并Path与Region，没有合并验证类别。
- **Root Cause**：验证类别按来源Sheet而非字段语义分流；地址合法性模型没有把访问粒度、按粒度对齐和整个访问范围纳入同一判断；缺少RW拆分门禁和分类展示合并规则。
- **Change**：顶层类别收敛为`地址正确性`与`操作正确性`；地址类覆盖Region、访问粒度、对齐和范围越界，模式与使能归操作类；混合失败原因强制拆分或进入Missing Input；RW仅在读写语义不同才拆分；连续相同的四层分类分别合并展示。
- **Preserved Behavior**：保留Master→Slave对象、4KiB穷举/抽样阈值、边界/典型/Bank/随机候选、非法行为具体化、Lifecycle、RAW、testcase+covergroup和禁止猜测规则。
- **Validation**：正文候选层级、交叉规则、输出结构、Final Gate与regression使用同一分类模型；DTE→CORE_MEM样例中transfer_mode与Segment使能不再进入地址类别。
- **Pending**：设计分析中的`地址、长度或对齐不满足约束`仍需拆成独立输入对象并补充具体非法地址表达式。

## 2026-11-02 | Split Legal Address Samples and Access Granularity

- **Problem**：合法地址TP把地址样本、访问粒度以及完整transaction前置条件堆在同一场景中，地址值没有说明上下边界、典型、Bank或随机语义；Custom协议还可能被错误套用通用size表达。
- **Root Cause**：地址候选与粒度候选虽在生成流程中可独立产生，正式TP阶段却缺少强制分离规则；对齐规则被过度统一为`addr % size == 0`。
- **Change**：合法地址抽样与合法访问粒度分别生成TP；地址样本强制带场景标签；粒度使用协议真实的size、LEN、固定宽度或步进；每个粒度只需一个合法地址，不做全地址×全粒度交叉。
- **Preserved Behavior**：保留地址边界、典型、Bank、随机候选，4KiB阈值、非法地址、操作正确性、Lifecycle、RAW和覆盖策略映射能力。
- **Validation**：正文地址层级、Final Gate与regression均要求两类TP独立；DTE2CM使用接口宽度、LEN计数单位和8B步进，不虚构size信号。
- **Pending**：DTE→CORE_MEM上边界合法起始地址仍需结合实际transaction footprint确定。

## 2026-11-02 | Localize Review Schema and Separate Execution Status

- **Problem**：人工表格混用英文Lifecycle/Scenario字段，coverage strategy同时塞testcase与覆盖方法，verification goal与场景重复；用户还需要跟踪已测试和已覆盖，但这两者不能污染TP定义状态。
- **Root Cause**：canonical机器schema被直接暴露为人工评审表头，缺少展示映射与执行状态模型。
- **Change**：中文表格展示`状态/测试状态/覆盖状态/TP场景/Testcase/覆盖策略/覆盖映射`；Lifecycle映射为完整/草稿/阻塞；goal有效语义并入TP场景；testcase从覆盖策略拆列；测试与覆盖状态默认未执行并要求证据更新。
- **Preserved Behavior**：canonical正式字段、Lifecycle判定、非法行为目标、coverage mapping、Missing Input及机器转换能力保持不变。
- **Validation**：共享Contract、Path输出结构、Final Gate与regression均区分定义状态和执行状态；中文展示不丢失goal语义且不重复testcase。
- **Pending**：无。

## 2026-11-02 | Move Granularity to Legal RW Operation

- **Problem**：上一版把访问粒度建成地址正确性子类别，并把写后读数据一致性建成合法操作子类别，导致操作正确性缺少真正的合法RW对象。
- **Root Cause**：混淆了地址样本、协议操作语义与Testcase/check方法三个层次。
- **Change**：地址正确性只保留地址抽样；支持粒度与READ/WRITE合并为`操作正确性→合法操作｜RW`；写后读和数据模式降为Testcase/check方法；地址TP与操作TP共享同一合法Path case。
- **Preserved Behavior**：地址样本标签、粒度覆盖、对齐/范围约束、非法单点隔离、Lifecycle和覆盖状态模型保持不变。
- **Validation**：正文分类层级、Final Gate与regression一致；DTE→CORE_MEM不再存在“合法地址访问｜访问粒度”或“合法操作｜写后读数据一致性”。
- **Pending**：无。

## 2026-11-02 | Make Address Samples Deterministic

- **Problem**：地址TP默认包含典型和随机场景，上边界未使用真实端口footprint；已知Bank数量被误认为足以生成Bank代表地址；LEN步进只写“整数倍”而没有显示完整取值边界。
- **Root Cause**：抽样规则追求通用性，未区分确定性覆盖语义与testcase随机化，也未把Master访问视图的实际footprint作为上边界计算依据。
- **Change**：默认地址场景收敛为下边界、按最小实际footprint/对齐计算的上边界合法起始地址和Bank代表地址；典型/随机仅在输入明确要求时生成；Bank选择公式缺失时保持draft；有限LEN步进显示完整紧凑集合。
- **Preserved Behavior**：Bank覆盖、非法地址、地址/操作分层、共享Testcase、Lifecycle与Missing Input保持不变。
- **Validation**：正文、Final Gate和regression使用同一确定性地址集合；DTE→CORE_MEM以256B/T计算上边界为0x804F_FF00，Bank代表地址因缺少全局Bank选择公式保持draft。
- **Pending**：补齐DTE视角CORE_MEM全局地址到8 Bank的选择公式。

## 2026-11-02 | Gate Illegal Address TP by Stimulus Reachability

- **Root Cause**：生成器把“地址/长度/对齐不合法”直接展开为Path TP，未先确认Master能否通过正常可编程接口产生该刺激；共享`transfer_mode`与Segment使能也在每条Path重复出现。
- **Change**：非法地址先做刺激可达性判定；正常接口可达才生成Path TP，仅非法配置/force可达则转异常TP，结构不可达则不生成，证据不足只输出Missing Input。共享配置异常不再重复生成Path TP，也不为其重新引入Module TP。合法地址、合法RW和合法访问粒度拆成相邻三条TP并共享Testcase。
- **Preserved Behavior**：地址/操作顶层分类、确定性地址抽样、Bank覆盖、Lifecycle、RAW与覆盖策略保持不变。
- **Validation**：DTE_DSA→CORE_MEM删除非法transfer_mode、Segment未使能及混合非法行；非法地址转为可达性Missing Input。最新设计分析确认`Bank=A[9:7]`，已回填8个Data Bank代表地址。
- **Pending**：确认DTE最小合法transaction footprint与地址对齐要求后回填上边界。

## 2026-11-02 | Reframe Access Class and Interface Coverage Mapping

- **Root Cause**：`地址正确性/操作正确性`顶层分类无法直观看出合法与非法访问；覆盖策略与覆盖映射重复，且映射长期停留在DUT链路TODO，缺少实际采样事件和值。
- **Change**：顶层分类改为`合法访问/非法访问`，子类别区分地址与操作；Path人工表删除覆盖策略列；覆盖映射强制包含真实IF、`cover_event`和`cover_value`。关键输入缺失导致场景、预期或覆盖映射无法闭合时使用`阻塞`。地址场景用富文本突出上下边界、Bank计算规则和Bank代表地址。
- **Validation**：DTE_DSA→CORE_MEM三条合法TP映射到`dte2cm`，分别采样addr、rd/wr req及addr+mask；地址抽样TP因上边界语义未闭合改为阻塞。
- **Pending**：补齐最小合法transaction footprint与对齐要求。

## 2026-11-02 | Generalize MEM RAW and Sample Large LEN Domains

- **Root Cause**：合法RW只写READ/WRITE枚举，未体现Memory的通用先写后读闭环；16-bit LEN域被表达成全量集合，误把`LEN=0`当成可搬移粒度。
- **Change**：Memory Path默认生成同地址先写后读并按mask比较的RAW TP；IO/MMIO按实际能力独立表达读写，不强套RAW。大规模等差LEN域覆盖下界、上界和中间随机合法值；Segment未参与编码0不计入访问粒度。
- **Validation**：DTE_DSA→CORE_MEM上边界按用户确认的最小8B访问闭合为`0x804F_FFF8`；LEN1~3覆盖8B、65528B与中间`8×N`随机值。

## 2026-11-02 | Split MEM Read/Write and Add RAW Constrained Cross

- **Root Cause**：单条MEM RAW同时承担基础读写能力和数据一致性交叉，无法清晰表达读、写各自覆盖，也使地址/粒度/Lane/Mask交织关系隐藏在Testcase中。
- **Change**：Memory Path拆为`操作合法｜MEM读`、`操作合法｜MEM写`和`合法访问｜RAW`。RAW作为受约束大Cross，覆盖地址样本、写粒度、读粒度、Lane和Mask；读范围必须包含于写范围，范围完全相等必须命中。
- **Validation**：DTE_DSA→CORE_MEM新增独立RAW行；覆盖映射统一使用`sample_if：DTE_IF_009（dte2cm）`，`cover_value`直接引用req/addr/mask/rsp逻辑。

## 2026-11-02 | Restore Independent Access Granularity TP

- **Root Cause**：拆分MEM读、MEM写和RAW时误把访问粒度仅作为各TP参数，导致合法粒度域本身失去独立TP。
- **Change**：恢复`操作合法｜访问粒度`，顺序固定为地址抽样、MEM读、MEM写、访问粒度、RAW综合交叉；RAW引用粒度TP但不替代它。
- **Validation**：DTE_DSA→CORE_MEM恢复8B/65528B/中间随机粒度行，RAW编号顺延为tp005。

## 2026-11-02 | Remove Redundant Standalone MEM Read/Write TP

- **Root Cause**：MEM读、MEM写没有RAW之外的独立预期行为，单列后与RAW中的读写请求和数据检查重复。
- **Change**：Memory Path默认保留地址抽样、访问粒度和RAW；只有纯读/纯写存在RAW未覆盖的独立协议响应或能力目标时才拆分。
- **Validation**：DTE_DSA→CORE_MEM删除两条重复读写TP，访问粒度与RAW编号整理为tp002、tp003。

## 2026-11-02 | Merge Legal Path Testcase Across Address, Size and RAW

- **Change**：地址抽样、访问粒度和RAW三条TP共用一个纵向合并Testcase。Testcase只保留同粒度RAW与异粒度RAW两类；异粒度要求写粒度大于读粒度且读范围包含于写范围。
- **Validation**：DTE_DSA→CORE_MEM的J2:J4已合并，避免三行重复描述相同执行方法。

## 2026-11-02 | Add Path Feature Verification Category

- **Root Cause**：读写并发、Bank仲裁、局部反压和响应顺序无法自然归入地址、粒度或RAW，遗漏后会使Path协议特性不完整。
- **Change**：新增顶层`通路特性`类别；每条归一化且可独立激励、判定和覆盖的Feature生成一条TP。混合源行先拆Feature，同义多行合并证据。
- **Validation**：DTE_DSA→CORE_MEM新增不同Bank读写并发、同Bank冲突仲裁、Bank级局部反压和响应顺序4条TP；Q_020相关两条标记阻塞。

## 2026-11-02 | Route Feature TP to Covergroup, Assertion or Scoreboard

- **Change**：人工表`覆盖映射`改为`验证映射`。合法输入空间使用covergroup；握手、反压、稳定性等时序不变量使用assertion并配cover property；响应归属/顺序使用scoreboard并辅以局部assertion。
- **Validation**：DTE_DSA→CORE_MEM前三条通路特性使用assertion+cover property，响应顺序使用scoreboard+assertion；逻辑信号统一为设计分析中的rd_req/wr_req命名。

## 2026-11-02 | Move TP Scenario Next to Subcategory

- **Change**：人工表列顺序调整为`子类别 → TP场景 → TP_ID`，使语义描述紧邻分类层级；状态列随之右移并同步条件格式引用。
- **Validation**：Path TP v1已将原I列移动到D列之后，红黄绿条件格式改为引用G列TP状态。

## 2026-11-02 | Keep Deferred Illegal Access Placeholder

- **Change**：用户暂缓非法访问展开时，主表保留一条浅红底阻塞占位，记录待闭合的非法地址、长度、对齐可达性及异常行为，不伪造具体TP。
- **Validation**：DTE_DSA→CORE_MEM新增`非法访问｜待展开`占位行。

## 2026-11-02 | Replace Category Columns with a Three-Level TP Scene Tree

- **Root Cause**：`验证类别/子类别`同时承担合法性、功能域和具体场景三种语义，无法稳定表达“通路功能特性/通路性能特性”及其下属节点；Region独立成列也增加了重复视觉层级。
- **Change**：人工表改为`Path（含Region）→ TP层级1 → TP层级2 → TP层级3`。Region使用换行和中文括号合入Path；层级节点分别独占一行并逐级换列缩进，只有叶子行承载正式TP字段。默认一级区分通路功能与性能，功能下区分单次合法、单次非法、连续与并发、响应与顺序。
- **Preserved Behavior**：合法/非法/通路特性仍作为内部候选语义；TP_ID、Lifecycle、Testcase、验证映射及状态职责不变。
- **Validation**：`Path TP v1`的DTE_DSA→CORE_MEM区块已重构为三级树，Path显示为`DTE_DSA→CORE_MEM\n（0x8040_0000–0x804F_FFFF（1MB））`；全表Path下拉及纵向合并同步使用Path+Region组合。

## 2026-11-02 | Drive TP Extraction by Path Type and Design-Analysis Evidence

- **Root Cause**：旧生成规则从地址/操作候选直接拼TP，未先区分Top外部Path、内部Memory Data Path和内部Non-Memory Ctrl Path；RAW还替代了基础MEM读写，导致单次能力与多事务Cross混在同一层。
- **Change**：新增F1~F7证据驱动Flow；按边界与Slave类型判定三类Path并路由到接口分析、Path特性、通路地址、Module、存储信息和性能Sheet。Inside Data Path固定拆分基础MEM读、MEM写与多事务RAW；`1.3`改为`多事务访问`。完整工作簿新增首页`TP提取Flow`。
- **Preserved Behavior**：地址抽样、粒度、非法可达性、Lifecycle、验证映射、三级展示树和状态职责保持不变。
- **Validation**：DTE_DSA→CORE_MEM新增独立MEM读/MEM写TP，RAW移动到`1.3.1 顺序相关访问｜RAW`；首页记录三类Path映射和统一分类树。

## 2026-11-02 | Add Path Inventory and Path Base TP as Step 1

- **Root Cause**：旧Flow在识别Path后直接进入类型分类和功能TP，缺少“每条路是否至少走通一次”的基础层，导致地址、RAW和通路特性与最基本的连通性目标混在一起。
- **Change**：新增`path_base_tp`阶段与独立`Path Base TP`Sheet。Path Inventory取地址空间、Path特性关联通路和接口分析的并集；每条legal Path/Region用一个最小合法事务证明目标接受且发起端可观察完成。RW在同一Base TP中各执行一笔，不展开地址扫描、全粒度、RAW、并发或性能。
- **Preserved Behavior**：三类Path模板、地址抽样、非法可达性、多事务Cross、Lifecycle和验证映射规则保持不变，均在Base TP之后继续生成。
- **Validation**：`TP提取Flow`首页已改为Step 1流程框图；34条legal Path/Region按原子操作展开为63条Base TP，其中MU_DSA→CORE_MEM读/写因合法地址、粒度和完成语义缺失保留为blocked。首列使用`base_tp_001~base_tp_063`连续编号，Master/Slave/Region拆列，Master、Slave与操作启用下拉。
- **Follow-up**：Base TP ID改为`<master>2<slave>_base_<序号>`并在每条Master→Slave内独立编号；Master/Slave相同连续单元格纵向合并且保留下拉。根据Module Profile补入RV_CORE→DTE_DSA/MU_DSA/VU_DSA三条确定性功能触发TP，场景引用指定trigger地址和值，不依赖随机命中。首页新增Path Base TP模型表，原`最小合法刺激`改为简洁`场景TP`。
- **Semantic correction**：Region改为场景输入，不再默认作为Base TP拆分维度。Base TP身份固定为Master→Slave×合法操作；Data/Scale等地址窗口的全面覆盖归后续地址正确性TP，除非它们实际连接不同硬件通路或完成语义不同。
- **Path source-of-truth correction**：`通路与地址空间`改为Path身份唯一主清单，TP侧直接转换legal行；`Path特性`、`接口分析`和Module Profile仅按统一通路ID补充特性、接口和trigger语义。出现主表外Path或自由文本名称不一致时报告设计分析问题，不再通过多Sheet并集重新生成Path。
