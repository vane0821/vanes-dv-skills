# Path协议特性清单

Path特性是协议适用时必须填写的固定能力清单，不依赖资料是否主动描述。每项必须有已确认值或`tbd`待确认行。

除固定的AXI/APB目录外，Custom协议必须从通路接口契约建立特性，至少覆盖：请求/响应握手与反压稳定性、地址解释、访问size或数据宽度、byte enable/mask、顺序与完成语义、非法/错误响应。每条逻辑Path至少出现在一个特性的`关联通路`中；接口存在但细节缺失时建立`custom_<path>_<item>_tbd`，不得整条Path缺席。

## AXI

每条目标侧为AXI的Path必须关联：

| 特性项 | ID示例 | 缺失处理 |
|---|---|---|
| 顺序属性 | `axi_order_weak` | 建立`tbd`行并确认排序/完成保证 |
| 访问size | `axi_size_4b` | 分Slave建立`tbd`行，确认ARSIZE/AWSIZE集合及读写差异 |
| Burst类型 | `axi_burst_incr` | 确认允许类型集合 |
| AXLEN位宽 | `axi_axlen_width_2` | 不得与AXLEN取值或最大beats混淆 |
| Outstanding | `axi_outstanding_8` | 明确计数口径和读写差异（如有） |
| Read Interleave | `axi_read_interleave_no` | 明确是否支持 |

数据宽度、地址宽度和ID宽度属于DUT对象/接口事实；只有它们形成端到端Path约束或扫描维度时才追加为Path特性，不替代上述必填项。

## APB

每条目标侧为APB的Path必须关联：

| 特性项 | ID示例 | 缺失处理 |
|---|---|---|
| 顺序属性 | `apb_order_strong` | 建立`tbd`行并确认顺序保证 |
| 访问size | `apb_size_4b` | 确认支持访问粒度 |
| Burst能力 | `apb_burst_none` | APB无burst；仍显式记录以闭合清单 |

## Custom

Custom协议不套用AXI/APB清单。根据接口定义建立稳定的协议特性清单；在该清单尚未确认前，不得由端口名称猜测能力。

## 关联规则

- 一个特性ID表达一个原子能力和值。
- 多个通路描述可以复用同一特性ID。
- 一个通路描述通过多行ID引用完成协议能力闭合。
- `关联通路`填写`Master→Slave`通路描述，不填写`legal/illegal/conditional`地址分段ID。
- 缺失值不得省略特性；使用包含对象限定的`tbd` ID，例如`axi_size_core_mem_tbd`。
- 确认后用值特性替换`tbd`特性，并删除已解决校准问题。
