# Access RAW Contract

本契约统一定义 Testpoint 中 Read-After-Write（RAW）的测试模式和展示方式。业务 Skill 负责决定目标对象的读写语义与 expected rdata，不得复制本文件的四组模式。

## 适用条件

仅当以下信息成立时生成 RAW TP：

- 目标支持写入后读回；
- 存在不会引入非目标副作用的安全测试对象；
- 数据宽度明确；
- 每组 expected rdata 可由目标的实际访问语义唯一计算。

缺少上述信息时，对象和 RAW 验证方向已经成立则保留 draft；对象或 RAW 能力尚未成立则输出 scope missing-input report。

## 固定测试模式

对目标全宽 `W` 按以下顺序执行一组 RAW 测试：

1. 全 0；
2. 全 1；
3. `01` 交织（从最高位观察为 `0101...`）；
4. `10` 交织（从最高位观察为 `1010...`）。

四组模式属于同一 RAW goal，不拆成四条 TP。`W` 已知时必须展开为实际数值，不保留模式占位符。

## 输出格式

```text
RAW 测试：
wdata = <全 0 实际值>，rdata = <expected rdata>
wdata = <全 1 实际值>，rdata = <expected rdata>
wdata = <01 交织实际值>，rdata = <expected rdata>
wdata = <10 交织实际值>，rdata = <expected rdata>
```

`rdata` 是按目标语义计算的 read-after-write 结果，不默认等于 `wdata`。

## 业务语义归属

- Register Access 根据 RW、RESERVED、RO、side effect 等 field access semantic 计算寄存器整体 rdata。
- Path RAW 只验证 Master 到 Slave 的端到端读写传输；使用已确认语义的安全目标计算 rdata，不在 Path Skill 中推导寄存器 field 语义。
