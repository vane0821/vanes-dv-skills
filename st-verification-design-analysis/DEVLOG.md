# DEVLOG

## 2026-10-19 | Memory Profile and Backdoor Initialization Evidence

- **Problem**：原模型把物理Memory组织统一当作可跳过的实现细节，无法支撑后门初始化；容量、Bank数和接口宽度即使已知，也不足以唯一生成RTL层次写入或VMEM镜像。
- **Root Cause**：工作簿只有Path、Module和平台映射，没有承载逻辑存储视图、物理Bank/Macro视图及初始化元数据规则的唯一证据位置。
- **Change**：新增条件式`存储信息`Sheet，固定包含存储组织总览、按Master访问视图和后门初始化条件；明确层次路径、Bank/Row/Macro映射、位序、ECC/Parity及Mask元数据是“可直接生成”的必备闭环。
- **Preserved Behavior**：Module Sheet仍只含MMIO、接口、编程示例和Feature；默认仍跳过与外部验证无关的内部流水实现；平台文件继续只能做一致性检查，不能反向覆盖设计证据；校准问题仍位于最后。
- **Validation**：Memory对象必须记录容量、Bank、地址规律、宽度和延迟；不同Master访问视图拆行；缺少任一物理映射要素时`可直接生成=否`并关联校准问题；逻辑与物理地址视角并存不误报冲突。
- **Pending**：无。

## 2026-10-16 | Target-neutral Path Test Strategy

- **Problem**：Path目标不限于MMIO，列名`关联MMIO测试策略`会错误排除Memory和Custom目标。
- **Change**：Path统一使用`测试策略`；固定策略目录同时适用于MMIO、Memory和Custom。
- **Validation**：Memory的`raw_check`直接比较读回与写入值，被访问byte默认全有效，不建立或展示Write Mask；MMIO仍按寄存器Write Mask计算预期值。

## 2026-10-15 | Path Feature Coverage and Conditional Illegal Pairs

- **Change**：`映射去向`收敛为仅供人工讨论闭环的`讨论映射`，设计来源不再重复填写；仅已失效讨论标灰。
- **Change**：Custom协议从通路接口提取握手、地址、粒度和响应特性，并增加“每条逻辑Path至少关联一项特性”门禁。
- **Change**：带合法条件的地址空间按独立失败条件生成illegal对偶；无法证明的非法响应保留待确认问题。
- **Refinement**：地址型illegal必须由Module MMIO/表项窗口对声明空间求补集，展开为具体地址段；legal行同步记录合法窗口摘要。

## 2026-10-15 | Master-specific Write Capability

- **Problem**：合法地址统一R/W全交叉会误测trigger、command、W1C、只读寄存器，也无法表达不同Master对同一Slave的写能力差异。
- **Change**：新增逐通路Master视角写能力规则，固定四种选项，并分别记录允许条件、size、RAW mask、验证方式、状态和依据；Memory使用byte mask规则且不进入mmio_write_mask.vmem。
- **Validation**：副作用写RAW mask=0且关联专项case，只读=N/A，未知=TBD；普通RAW必须有Master视角mask，禁止直接复制Access结论。

## 2026-10-15 | Vertical Register and Field Sections

- **Problem**：横向组合寄存器属性、字段属性和校准列导致Module Sheet过宽，VU等多字段模块难以阅读。
- **Change**：MMIO改为上下两个独立分段；寄存器段一行一个寄存器，字段段一行一个Field并显式关联Register ID/对象。
- **Validation**：TS/DTE/MU/VU均检查`寄存器信息 → 字段信息 → 接口信息`顺序，Write Mask只存在于寄存器段。

## 2026-10-15 | Layered MMIO Headers

- **Problem**：单个“MMIO信息”横跨全部列，无法直观看出Write Mask属于寄存器、Field属于字段、Q编号属于校准元数据。
- **Change**：Module Sheet统一采用两级表头：A:H“寄存器信息”、I:L“字段信息”、M:P“关联与校准”，下一行保留详细字段名。
- **Validation**：TS/DTE/MU/VU四张Sheet均检查三个固定分组及列边界。

## 2026-10-15 Platform Mapping and Evidence Lifecycle

- Separated verification-platform files from design `SRC_xxx` evidence into a dedicated `平台映射` sheet using `PM_SRC_xxx`.
- Added explicit platform-versus-design consistency checks; platform implementation may expose differences but cannot overwrite design analysis.
- Added lifecycle rules for human discussion records: targeted design-document recheck on regeneration, map to design evidence or verification rules, then retain as grey inactive history.
- Moved warning highlighting to inaccurate/pending business analysis rows; calibration issue rows use normal background with automatic wrapping.

## 2026-10-15 | Register-level Write Mask and MMIO Grouping

- **Problem**：上一版把Write Mask错误建模为Field属性；编码表仅写“按XX编码表”；部分TBD没有待确认底色。
- **Change**：MMIO拆成寄存器级A:H与字段级I:L，按寄存器分组；Write Mask改为每个寄存器一个；编码表强制引用文档章节；TBD/待确认/Q_xxx统一高亮。
- **Validation**：每个寄存器至多一个Write Mask，字段行不再携带Mask，泛化“见文档/按编码表”与无底色TBD均视为门禁失败。

## 2026-10-15 | Field-level MMIO, Write Mask and No-reset Evidence

- **Problem**：MMIO组摘要无法生成字段级测试与写后预期值；文档未提供复位定义时曾被错误归纳为Reset=0。
- **Change**：强制每个Field独立成行，`Access/写Mask`记录字段写Mask；明确区分`无复位（已确认）`与`无复位（Q_xxx）`，后者生成信息缺失问题并高亮。
- **Validation**：缺失复位证据不进入reset=0测试；VU动态/静态配置组必须展开真实寄存器、字段、值空间与Mask。

## 2026-10-14 | Add ST Boundary Filtering

- **Change**：提取流程新增ST边界判断，优先抽取外部配置、接口、行为、错误和性能契约，默认快速跳过内部流水、lane/vlane、状态机和物理buffer实现。
- **Preserved Behavior**：实现细节若形成可观察顺序、吞吐、对齐或错误约束，仍提升为结构化证据；文档冲突与缺失规则不变。

## 2026-10-14 | Add MU and VU Module Profiles

- **Change**：新增MU、VU Sheet，按MMIO、接口、编程示例和Feature提取MAS/详细设计中的ST外部契约。
- **Source cleanup**：原SRC_010与SRC_017均指向DTE MAS，合并为SRC_017；输入来源按Top设计文档、模块设计文档、代码文件、人工确认分组。
- **Path feature**：关联通路改为单元格内换行；AXI size按人工确认闭合为最小4B、最大总线数据宽度，删除已解决问题并重编号。
- **Validation**：增加MU/VU关键对象、来源分组、DTE来源去重、AXI size和关联通路换行门禁。

## 2026-10-14 | Rename to ST Verification Design Analysis and Add DTE Profile

- **Change**：Skill更名为“ST 验证设计分析”；从DTE MAS与DTE LLD补齐DTE MMIO、接口、编程示例及功能/约束/错误/性能Feature，并回标全局Path。
- **Evidence**：所有DTE结论定位到MAS/LLD章节；已明确的CoreMem、MatrixMem、ShareMem通路不再保留旧问题，Mmem/MU共享接口按`sel`区分。
- **ST Boundary**：内部lane调度不作为ST验证对象，只保留端到端可观察行为；跨通道可乱序与TS完成有序作为外部契约。
- **Pending**：仅保留SYS_CTRL/SYS_STATUS最终字段、异常通知/恢复判据、PMU及精确Outstanding深度等真实未决项。
- **Validation**：新增DTE Sheet门禁，检查关键MMIO、接口共享关系、Feature/示例、全局地址与Path问题闭合。

## 2026-10-14 | Normalize MMIO Address and Array Expansion

- **Problem**：TS MMIO只保留局部Offset和`xx`占位符，且`STREAM_NUM`采用了正文旧表中的Reset=0，导致下游无法确定绝对地址、数组展开数量，并生成错误Reset测试。
- **Root Cause**：Module Profile缺少Count/索引范围字段；完整性门禁未要求绝对地址、Offset和stride闭合；文档内部修订说明与旧表冲突时没有证据优先级规则。
- **Change**：MMIO新增`Count/索引范围`；存在系统基地址时同时输出绝对地址和Offset；数组强制输出Count、索引上下界及stride；修订说明需经另一设计输入或RTL佐证后采用。
- **Preserved Behavior**：Path/Profile结构、Sheet顺序、Feature关系、协议特性清单、既有Path和未决校准问题保持不变。
- **Validation**：TS门禁检查`STREAM_NUM Reset=16`、绝对地址`0x4800_8208`、Task Chain与Router Table均为64项且保留stride；原有35条Path、13项Path特性和8个未决问题继续通过。
- **Pending**：无。

## 2026-10-14 | Populate TS Module Profile

- 从TS MAS与TS LLD补齐MMIO字段、对外接口、编程示例和功能/约束/错误/性能Feature。
- 将TS配置相关Feature反标到`SCP_CTRL→TS_CFG`合法通路。
- 校准全局事实：保留32-bit数据、15-bit地址与全局NoC地址；将APB3/APB4版本差异和文档TBD基地址列为未决问题。
- 删除原TS资料缺失问题，校准问题连续重编号。

## 2026-10-14 | Path Description and Display Merge

- `Path特性`移到`通路与地址空间`之前。
- 新增`通路描述`，用`Master→Slave`统一关联同一路径的legal/illegal地址分段。
- `Path特性.关联通路`不再记录地址分段ID。
- 自定义协议及通路表对连续相同的展示字段做纵向合并。
- 访问粒度未知时直接显示对应size特性ID。

## 2026-10-14 | Create Unified ST Verify TP Evidence Organizer

- **Problem**：Path Skill同时承担原始资料整理和正式TP生成，Module ST缺少可与Path共用的唯一证据输入件；协议能力又依赖资料是否主动描述，容易漏掉必须确认的特性。
- **Root Cause**：输入证据组织没有独立职责，Path与Module Profile未在同一工作簿闭合，协议能力没有固定必填清单。
- **Change**：创建独立输入证据整理Skill；统一工作簿包含输入件描述与分析、通路与地址空间、原子Path特性、每Module一Sheet及最后的校准问题；AXI/APB使用固定必填特性清单，缺值仍生成`tbd`特性。
- **Preserved Behavior**：现有Path TP Skill的正式TP生成逻辑本阶段不变；Bach Core既有35条Path、地址视角、Region、合法性、扫描、响应、DUT映射和未决问题在迁移中保留。
- **Validation**：由新版工作簿校验器检查Sheet顺序、35条Path、协议事实、固定特性闭合、双向关联、问题引用及公式错误。
- **Pending**：Module Profile仍需使用TS真实设计资料继续校准；Path TP和Module ST TP消费新版工作簿的切换属于后续阶段。

# 2026-10-14 | Close MU TopK with Cross-View Evidence

- **Problem**：MU MAS 5.2.7已经给出TopK表项数量、索引和布局，但整理器只看DTE通路章节，将DTE→MU TopK错误保留为信息缺失。
- **Root Cause**：缺少“目标存储视角 + 发起接口视角 + Top连接视角”的跨章节证据闭环门禁。
- **Change**：MU TopK归一化为16个stream entry、每项256B、CSR stride 0x100；DTE视角保留0~15条目索引和2×128B同拍带宽；删除已解决校准问题并连续重编号。第一张Sheet更名为`输入件描述与分析`。
- **Preserved Behavior**：DTE访问的独立通路、共享接口选择关系、其余35条Path和既有Module Profile结构保持不变。
- **Validation**：新增TopK Path、MU_REG_009、5.2.7依据链、已解决问题移除和新Sheet名称门禁。

# 2026-10-14 | Expand Multi-Interface DUT Objects

- **Problem**：`DTE_DSA`把dte2cm、dte2mm、dte2sm和dte2mu压缩在同一行，位宽、地址宽度、操作和依据无法一一对应。
- **Change**：按接口展开为四行；对象基础列纵向合并展示；dte2mu单独保留共享dte2mm、sel=1、0~15 entry index和256B带宽语义。
- **Validation**：校验四个接口逐行存在、数量为4，且协议列不再用斜杠压缩。

# 2026-10-14 | Use Canonical Feishu Source Links

- **Change**：输入来源中的Top与模块设计文档统一记录完整飞书Wiki URL，不再使用标题、简称或裸token代替链接。
- **Validation**：对所有飞书设计来源增加完整URL门禁。

# 2026-10-15 | Normalize Source Identity and Add RVCore-to-DSA Paths

- **Problem**：来源表存在一行两个文件、重复来源、历史跳号和重编号中间态；人工讨论占用`SRC_xxx`，导致业务引用难以稳定维护。
- **Change**：设计来源按展示顺序重建为连续唯一的`SRC_001~SRC_012`，强制一行一来源；人工讨论改用`DISC_xxx`，平台输入保持`PM_SRC_xxx`；补充RVCore到DTE/MU/VU DSA三条局部地址通路。
- **Evidence**：DTE/MU/VU文档分别提供局部寄存器或接口地址视角；三者统一从0开始的共性结论同时登记为`DISC_008`人工输入，等待后续设计文档闭合。
- **Validation**：全工作簿不得残留`TMP_SRC`或`SRC_013+`旧号；所有业务依据同步到新号段；平台映射新增三条RVCore通路。

# 2026-10-15 | Unify MMIO Write Mask and Platform Reset Inputs

- **Problem**：TS/MU仍使用旧的`Access/写Mask`混合列，实际只填Access；新增RVCore通路未与既有RVCore通路连续分组。
- **Change**：六条RVCore通路连续排列并合并Master/协议；TS/MU迁移为独立`Access`和`Write Mask`列，TS按寄存器分组，MU无法唯一计算的Mask建立Q_012；平台映射新增DTE/MU/VU三份`*_mmio_reset.vmem`及逐地址Reset一致性检查。
- **Validation**：所有Module MMIO表头统一；RVCore合并范围为A31:A36、D31:D36；平台输入为PM_SRC_003~005且对应MAP_RESET_001~003。

# 2026-10-20 | Close Register Width and Effective-Bit Consistency

- **Problem**：32-bit MMIO寄存器中的16-bit有效字段被错误扩展为`[31:0]`，Write Mask随之错误生成`0xFFFFFFFF`，普通RAW也错误使用全宽直接比较。
- **Root Cause**：已有规则规定Mask由有效可写Field并集计算，但完整性门禁没有强制校验寄存器容器Width、有效bit、Field位域、Write Mask与RAW预期之间的一致性。
- **Change**：明确Width仅表示MMIO容器宽度；有效Field必须按文档证据收窄；增加逐寄存器五项闭环校验，并禁止在位位置未知时把有效bit默认从bit0连续铺开。
- **Preserved Behavior**：Module Sheet结构、字段分段、Access、Reset、Master视角写能力、条件RAW、平台映射与校准问题生命周期保持不变；Write Mask仍只有一个寄存器级权威值。
- **Validation**：新增语义回归门禁：Field不越界；Mask等于有效可写Field并集且不覆盖保留位；非全宽Mask的普通RAW必须按Mask比较或使用已证明的转换表达式。
- **Pending**：无。

# 2026-10-20 | Make Platform Mapping Recheck Mandatory

- **Problem**：工作簿更新寄存器Write Mask后，平台侧`mmio_write_mask.vmem`可能仍保留旧值或缺少新条目，但原流程只固定登记Reset镜像，且可能沿用历史“已检查”状态。
- **Root Cause**：平台映射没有把Write Mask镜像列为固定输入，也没有规定每次工作簿更新必须按当前revision重新执行映射检查。
- **Change**：将`mmio_write_mask.vmem`纳入平台输入；逐地址对照全部已确认`raw_check`寄存器；每次创建、更新或重新生成工作簿都强制复核地址、Reset与Write Mask映射并记录revision。
- **Preserved Behavior**：平台实现继续只用于一致性检查，不得作为设计证据，也不得反向覆盖Module/Profile结论。
- **Validation**：缺项、重复、地址或Mask不一致必须写入平台映射结果并标记`不一致`；不存在以历史检查状态跳过本轮检查的路径。

# 2026-10-29 | Rename and Group Interface Analysis

- **Change**：将独立通道Sheet从`DUT对象与接口`统一更名为`接口分析`。同一通道的A:H通道级字段强制分列纵向合并，I:M协议附着接口明细保持逐行展开。
- **Preserved Behavior**：Top/内部通道分段、单信号位宽、通道语义与来源不变。
- **Validation**：工作簿顺序包含`输入件描述与分析 → 接口分析 → Path特性`；每个多行通道对A:H各有1个合并区，I:M无通道级合并。
- **Display refinement**：合并区改为顶部对齐与自动换行；Top/内部通道仅A:H使用浅蓝/浅绿底，I:M改为白底深色正文；待确认黄色高亮保留。
