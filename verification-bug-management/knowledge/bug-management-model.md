# Verification Bug Management 当前能力规格

本文只描述当前有效行为，不记录开发历史。未被现有资料唯一确定、且会影响等价重建的内容集中列在“Spec Gaps”。

## 1. Tool 定位与边界

一个 verification environment 对应一个 Bug repository。多名工程师共享 Git remote，每人使用独立 working copy。Git/YAML 是协作基础；Tool 管理 Bug submit、再次发生、reopen、analysis、escape analysis、close、查询和派生 summary，并从真实 verification execution site 采集现场。

当前不提供自动 duplicate 判断、owner/assignee workflow、`fixing`/`verifying` 状态、`bfix` 或 `bverify`。Existing Bug 归属由工程师判断。

## 2. Source of Truth

```text
bug_db/
├── bugs/
│   ├── BUG-0001.yaml
│   └── ...
└── summary.csv
```

`bugs/BUG-xxxx.yaml` 保存单 Bug 的完整当前属性和历史事件，是 Bug 数据的唯一 Source of Truth。

`summary.csv` 是全部 YAML Bug Records 的 derived global view，用于在 SSH/Git repository 中直接查看当前概要。它只能由 `bugs/*.yaml` 自动生成，禁止人工编辑；删除后必须能仅从 YAML 完整重建。它不保存 occurrence、analysis、escape analysis 等详细历史。固定列序为 `bug_id,status,module,type,found_date,fail_info,latest_analysis`。

## 3. Bug 数据模型

### 3.1 当前属性

| 字段 | 语义与约束 | 产生与修改 |
|---|---|---|
| `bug_id` | 必需，格式 `BUG-xxxx`，唯一标识 Bug | New Bug 时自动分配；之后不可变；并发冲突时由 transaction 重新分配 |
| `status` | 必需，只允许 `open` / `closed` | New Bug 为 `open`；close 改为 `closed`；closed Bug 再次发生时改回 `open` |
| `module` | 必需，Bug 所属模块，不属于 occurrence | New Bug 时人工输入；Existing Bug occurrence 沿用原值；当前 CLI 未定义独立修改入口 |
| `type` | 必需，多值字段，例如 `func`、`perf`、`timing`、`ppa` | New Bug 时人工输入；属于可修正的当前属性，但当前资料未定义独立修改入口 |
| `fail_info` | 必需，验证中观察到的 Fail 现象，即发生了什么 | New Bug 时人工输入；属于可修正的当前属性，但当前资料未定义独立修改入口 |

旧 YAML 的 `issue` 在读取时解释为 `fail_info`，信息不得丢失。新建或重新写出的当前模型只使用 `fail_info`，不长期双写两套字段。

### 3.2 历史事件

| 集合 | 内容 | 产生操作 | 规则 |
|---|---|---|---|
| `occurrences[]` | `date`、`author` 和 execution snapshot | New Bug 或 Existing Bug 再次发生 | append-only；New Bug 至少一条 |
| `analyses[]` | `date`、`author`、`analysis` | `bsubmit` 的 optional initial analysis 或 `banalyze` | append-only；旧判断即使被后续推翻也保留；无记录时写出可省略，读取时归一为空列表 |
| `escape_analyses[]` | `date`、`author`、`discovered_at`、`analysis` | `bescape` | append-only；无记录时写出可省略，读取时归一为空列表 |
| `resolutions[]` | fixed 或 accepted resolution 的业务信息 | `bclose` | append-only；reopen 不删除旧 resolution；无记录时写出可省略，读取时归一为空列表 |

YAML 的已确认语义结构为：

```yaml
bug_id: BUG-xxxx
status: open | closed
module: DTE
type:
  - func
fail_info: ...

occurrences:
  - date: YYYY-MM-DDTHH:MM:SS
    author: ...
    execution:
      design: unavailable
      verify:
        branch: ...
        commit: ...
      run_command: ...
      case_command: ...

analyses:
  - date: YYYY-MM-DDTHH:MM:SS
    author: ...
    analysis: ...

escape_analyses:
  - date: YYYY-MM-DDTHH:MM:SS
    author: ...
    discovered_at: ...
    analysis: ...

resolutions: []
```

上例展示 occurrence、analysis 和 escape analysis 的非空结构；non-empty resolution 的稳定 item shape 仍见 Spec Gaps。空历史集合在新 YAML 中可以省略，读取时必须归一为空列表。以下显式空列表与省略等价：

```yaml
analyses: []
escape_analyses: []
resolutions: []
```

字段值和 YAML 标量表达遵循实际数据。Design version 不可取得时，使用下文固定的最小 unavailable 表达。

`analysis` 解释 Bug 为什么发生。`escape_analysis` 解释为什么已有验证、流程或需求没有提前发现或避免。Escape 是独立历史分析，不是顶层 boolean，也不改变正常生命周期。

所有 event 时间使用运行环境本地时间、精确到秒，不保存微秒或 UTC offset。`author` 自动采集，按以下顺序取第一个可用值：

1. `git config user.name`；
2. 当前系统用户。

信息存在时记录实际信息。无法取得 Design version 时固定写：

```yaml
design: unavailable
```

不得写 `design: null`、省略 `design`，或增加 `available: false` 等控制字段。

## 4. Lifecycle

### New Bug

在当前 failure 现场执行 `bsubmit`。人工选择 New，输入 `module`、`type[]`、`fail_info`，可选输入 initial analysis；Tool 分配 `bug_id`、设 `status: open`、自动采集 event metadata 和 execution snapshot，并 append 首条 occurrence。

### Existing Bug occurrence 与 reopen

人工选择 Existing 并指定历史 Bug。Tool 加载最新 record，沿用 `module`，append 新 occurrence。若原状态为 `closed`，同时将 `status` 改为 `open`；旧 resolutions 保留。

### Analysis

`banalyze` append 一条普通原因分析，不覆盖既有分析。

### Escape Analysis

`bescape` append 一条带 `discovered_at` 的 escape analysis，不改变 `status`。

### Fixed Close

从用于确认修复的当前仿真现场执行。Tool 以 latest occurrence 的 Verify version 为起点、当前 Verify version 为终点建立 Git history/range，并采集当前 close snapshot。可展示 Git log、commit message、author、date、changed files 等派生信息；这些信息不重复保存为 Bug 当前属性，也不能自动声称某个 commit 的 changed files 只属于该 Bug。range 非法时必须报错，不猜测。人工确认后 append fixed resolution，并设 `status: closed`。

Design version 可获得时同样建立 occurrence 到 close 的 Design Git range；不可获得时使用 `design: unavailable`。

### Accepted Close

表示确认是 Bug，但基于现实约束可以接受。无需 fixed 仿真现场；人工输入 `accept_reason`，Tool 自动记录 `date`、`author`，append accepted resolution，并设 `status: closed`。不定义 `accept_basis`。

## 5. CLI Contract

所有命令保留自身 `--help`。写操作只有在权威 YAML 已按 Git transaction 成功提交到目标 remote 后才算正式成功；`--local-test` 例外见第 9 节。

### `bsubmit`

- 用途：New Bug、Existing Bug occurrence，以及必要时 reopen。
- 输入/交互：人工选择 New/Existing；New 输入 `module`、`type[]`、Fail 现象和 optional analysis；Existing 指定 Bug，不重复输入其 `module`。
- 自动处理：采集 execution snapshot 和 event metadata；按生命周期更新 YAML。
- 输出：人工可读地报告 Bug ID、New/Existing、是否 reopen 和写入结果。
- 错误：现场采集不足、Existing Bug 不存在、record 非法、Git transaction 未完成或 ambiguity 未解决时失败，不产生伪成功。

### `banalyze BUG-xxxx`

- 用途：向 `analyses[]` append 一条 analysis。
- 人工输入：analysis。
- 自动记录：`date`、`author`。
- 成功：事件经 transaction 恰好追加一次；Bug 原有历史不变。
- 错误：Bug 不存在、输入无效、record 非法或 transaction 未完成。

### `bescape BUG-xxxx`

- 用途：向 `escape_analyses[]` append 一条 escape analysis。
- 人工输入：`discovered_at` 和 analysis。
- 自动记录：`date`、`author`。
- 成功：事件经 transaction 恰好追加一次，`status` 不因 escape 自动变化。
- 错误条件同 `banalyze`。

### `bclose BUG-xxxx`

- 用途：以 fixed 或 accepted 关闭 open Bug。
- fixed：从确认修复现场采集当前 version snapshot，验证 Git range，展示可审阅的派生修改历史，人工确认后 append fixed resolution。
- accepted：人工输入 `accept_reason`，append accepted resolution。
- 成功：resolution 恰好追加一次且 `status: closed`。
- 错误：Bug 不存在、已关闭状态不满足当前操作、fixed snapshot/range 无法合法建立、缺少 accept reason、record 非法或 transaction 未完成。

### `bsearch`

- 用途：找 Bug、浏览 Bug；不判断 duplicate。
- 默认筛选：`status=open`。
- 默认列表：`Bug ID | Module | Type | Found Date | Fail Info | Latest Analysis`。
- `Found Date`：first occurrence 的 `date`。
- `Latest Analysis`：`analyses[]` 最新一条 `analysis`；没有时显示 `-`。
- 筛选：至少支持 `--module`、`--type`、`--status open|closed`、`--keyword`，允许组合；`--type` 对多值字段执行 contains。
- keyword：至少搜索 `bug_id`、`fail_info`、`analyses`、`escape_analyses`；旧 `issue` 先按 compatibility 映射为 `fail_info`。
- 输出：紧凑人工可读列表；显示可截断长文本，但不修改 YAML。
- 错误：筛选值或 record 无法解释时明确报告；零命中是有效结果，不是数据写入错误。

### `bshow BUG-xxxx`

- 用途：展开查看单个 Bug。
- 输出：人工可读地展示 `bug_id`、`status`、`module`、`type`、`fail_info`，以及全部 occurrences、analyses、escape analyses、resolutions；保留每个 event 的 date、author、execution snapshot 和已有业务信息。
- 禁止：只把 YAML 原文直接 dump 给用户。
- 错误：Bug 不存在或 record 无法读取。

### `bsummary`

- 用途：根据全部 `bugs/*.yaml` 生成或重建 `summary.csv`；不负责 Daily Report。
- 输入：正式 Bug DB 中的 YAML records，不以已有 `summary.csv` 作为输入。
- 列及顺序：`bug_id,status,module,type,found_date,fail_info,latest_analysis`。
- `found_date`：first occurrence 的 `date`。
- `latest_analysis`：`analyses[]` 最新一条 `analysis`；没有时为空。
- 输出：写入可由 YAML 完整重建的 `summary.csv`；终端只报告命令执行反馈。
- 成功：所有有效 YAML 均被纳入并完成 CSV 重建。
- 错误：YAML 无法读取、必需数据无法派生或 CSV 未完成重建时明确失败；不能用旧 CSV 掩盖错误。

### `bhelp`

- 用途：Tool 总帮助入口。
- 输出：只列真实支持的 `bsubmit`、`banalyze`、`bescape`、`bclose`、`bsearch`、`bshow`、`bsummary`、`bhelp`，每项包含一句话用途和常用 demo；说明已确认的 `--local-test` 用法。
- demo 至少覆盖：`bsubmit`、`bsubmit --local-test`、`bsearch`、`bsearch --module DTE`、`bsearch --type func`、`bsearch --status closed`、`bshow BUG-0002`、`banalyze BUG-0002`、`bescape BUG-0002`、`bclose BUG-0002`、`bsummary`。
- 禁止：展示尚未实现或 Pending 的能力。

## 6. Execution Snapshot

Occurrence 自动记录 `date`、`author`、`run_command`、`case_command`、Verify version 和 Design version。

- `date`：操作发生时的运行环境本地时间，秒精度，不带 UTC offset。
- `author`：当前操作人，优先取 `git config user.name`，不可用时取当前系统用户。
- `run_command`：来自当前真实 sim run 的实际底层执行命令，不由人工重输。
- `case_command`：根据实际 run 与 case list baseline 恢复出的最小上层 testcase invocation。
- Verify version：从 verification working copy 的 Git 获取当前 branch 和 commit。
- Design version：由当前环境可用的 Design version source 获取；当前环境无法取得时写 `design: unavailable`，不得猜测。

通用 Skill 只定义采集行为和失败语义。具体 verification environment 的 run directory、文件、进程入口、Design version source 和解析方式属于项目配置或 Environment Adapter，不进入通用 Skill。Adapter 无法取得必需现场信息时必须明确失败；不得用人工重复填写或猜测替代自动采集契约。

## 7. `case_command` Recovery

输出采用 verify_tools：

```text
single_case [lst=xx] case=xx [additional params]
```

恢复规则：

1. 从真实 execution site 得到最终生效的 actual run 配置。
2. 在 `case_lst` 中定位候选 lst 和其中的 `case_name`；未指定 lst 的默认入口使用 `case.lst`。
3. 以候选 lst 中该 case 的原始配置为 baseline，与 actual run 比较。
4. `single_case` 后续参数既可 override baseline 已有参数，也可 append 参数；结果只保留相对 baseline 的 override/append，值相同的 baseline 参数不重复表达。
5. 默认 `case.lst` 命中时输出 `single_case case=xxx ...`，不写 `lst=case.lst`。
6. 非默认 lst 输出 `single_case lst=xxx case=xxx ...`。
7. 多个 lst 命中同一 `case_name` 时，对每个候选与 actual run 比较，选择匹配且所需差异最小的候选。
8. 候选仍无法唯一确定、无法匹配或缺少决定性现场信息时报告 ambiguity 并失败，不凭猜测生成命令。

## 8. Git Transaction 与并发

正式写操作的逻辑 transaction：

```text
fetch/sync latest remote
→ load latest Bug state
→ apply current operation
→ commit
→ push
```

每位工程师使用独立 working copy。不同 Bug 通过独立 YAML 降低冲突；同一 Bug remote 已变化时不得 silent overwrite。

### Bug ID collision

不维护 `next_bug_id` 热点文件。New Bug 前同步 remote，根据已有 ID 分配；若并发 push 产生碰撞，重新同步，以最新 remote state 重新分配 ID并重试，绝不覆盖对方 Bug，也不要求用户手工改号。

### 同 Bug concurrent append

获取 remote 最新 record，把本次 append-only event 重新应用到最新状态，再 commit/push。重试必须保证当前 event 恰好一次：既不丢失对方 event，也不 silently duplicate 自己的 event。

正式 transaction 只有在 push 成功、remote 包含本次预期 YAML 变化且没有覆盖或重复并发事件时才成功。失败或重试耗尽必须明确报错。

`summary.csv` 不由每次 submit/analyze/escape/close 的用户 working copy 同步修改，避免成为并发写热点。`bsummary` 是根据 YAML 生成或重建它的正式命令；是否由 CI、定时任务或其他项目机制触发属于项目配置，不改变其派生属性。

## 9. `--local-test`

所有需要 Bug DB 的业务命令均支持 `--local-test`，包括 `bsubmit`、`banalyze`、`bescape`、`bclose`、`bsearch`、`bshow` 和 `bsummary`；`bhelp`、`bsnapshot` 不需要 Bug DB。local-test 使用仿真目录同层的本地 `bug_db`。

- 正常执行对应命令的读取、写入和 environment acquisition；
- 将读写限制在仿真目录同层的本地 `bug_db`；
- 不执行 Git fetch、commit 或 push；
- 不访问或改变共享 remote。

它用于验证 environment acquisition、YAML/model 和 CLI behavior，不得被描述为完成正式 project-integrated transaction。

## 10. Human-readable Output

- CLI 面向验证工程师阅读，字段名称体现业务语义。
- `bsearch` 使用紧凑列表；`bshow` 展开完整历史，不直接 dump YAML。
- 长文本只可在 display 层截断，原始 YAML 不得改变。
- 用户可见位置统一使用 `Fail Info` 或“Fail 现象”，不使用旧名称 `issue`。
- 不为程序方便向 YAML 增加无业务意义的状态控制字段。

## 11. External View 与 Notification

`summary.csv` 和飞书多维表格都是从 YAML Bug Records 派生的 global view，不能反向成为 Bug 数据源。Daily Report 是派生通知，不反写 Bug Record。

已确认的 Daily Report 内容为：

- Overview：Open、New、Closed、Reopened；
- Today New；
- Today Closed；
- Today Reopened；
- Today Escape。

当前不增加 Aging、inactive days、trend、type distribution、personal statistics 或 escape cause statistics。这些未来需要时从 YAML 派生，不扩展 Bug Schema。

Feishu Notification 当前为 Pending，不属于当前正式 Bug Tool 能力。未来若实现，只能在 Bug transaction 成功后作为 side effect；通知失败不得使已成功的 Bug transaction 回滚或变为失败，也不能成为 transaction 硬依赖。内网环境可能无法使用该扩展。

## 12. Reconstruction Acceptance

以下场景以“初始条件 / 操作 / 预期结果”验收等价重建：

| 场景 | 初始条件 | 操作 | 预期结果 |
|---|---|---|---|
| A New Bug | 当前 failure site 可采集 | `bsubmit` 选择 New | 生成唯一 YAML；含 module/type/fail_info、open 状态、首条 occurrence 和 snapshot |
| B Existing occurrence | open Bug 已存在 | `bsubmit` 选择 Existing | 沿用 module，恰好 append occurrence，不覆盖历史 |
| C Reopen | closed Bug 已存在 | Existing occurrence | append occurrence，status 变 open，旧 resolution 保留 |
| D Analysis | Bug 已存在 | `banalyze` | 恰好 append date/author/analysis |
| E Escape | Bug 已存在 | `bescape` | 恰好 append date/author/discovered_at/analysis；status 不被强制改变 |
| F Fixed close | open Bug 且合法 Verify range | `bclose` 选择 fixed | 展示派生 Git 信息；确认后 append fixed resolution 并 closed |
| G Accepted close | open Bug | `bclose` 选择 accepted 并输入原因 | append accepted resolution 和 accept_reason，并 closed |
| H Compatibility | YAML 只有 `issue` | search/show/read | 将其解释为 fail_info；信息不丢失；新数据不双写 issue |
| I Module | New Bug module=DTE | submit、Existing、search | YAML 保存 DTE；Existing 沿用；`--module DTE` 命中 |
| J Search default | open/closed 混合 | `bsearch` | 只显示 open，列与派生值正确 |
| K Search filters | 多 module/type/status/文本 | 单项及组合筛选 | AND 组合；type contains；keyword 覆盖规定字段 |
| L Show | Bug 含全部 event | `bshow BUG-xxxx` | 人工可读显示当前信息和完整历史，metadata/snapshot 不丢失 |
| M Summary rebuild | 删除 summary.csv，YAML 完整 | `bsummary` | 按固定列序仅从 YAML 重建 CSV；不生成 Daily Report；终端只给执行反馈 |
| N Help | 当前正式 CLI 可用 | `bhelp` | 仅列真实命令、用途、demo 和已确认 local-test 用法 |
| O Snapshot | submit/fixed close 现场有效 | 执行操作 | 自动记录 event metadata、run/case command、Verify 和 Design 表达 |
| P Run command | actual sim run 可识别 | submit | 保存实际底层命令，不要求人工输入 |
| Q Case recovery | case baseline 唯一匹配 | submit | 生成最小 `single_case`，只含必要差异 |
| R Ambiguity | 多候选差异同样最小 | submit | 明确 ambiguity 并失败，不猜命令 |
| S ID collision | 两人并发分配同一 ID | 同时 submit | 一方基于最新 remote 自动改号重试，不覆盖 |
| T Concurrent append | 两人修改同一 Bug | 同时 append | 两个 event 各保留一次，无 silent overwrite/duplicate |
| U Local test | 当前 execution site 可采集，本地 `bug_db` 可用 | 任一 DB-backed CLI 加 `--local-test` | 在本地 DB 完成对应读写；不 fetch、commit 或 push shared remote |

## 13. Spec Gaps

当前仍有两项会影响确定性重建的格式规则未定义：

1. `summary.csv` 中多值 `type[]` 在单个 CSV cell 内的编码与顺序。
2. 非空 `resolutions[]` 的 item shape：如何在每条 resolution 中区分 fixed 与 accepted。旧语义材料展示了 fixed/accepted 分组，但当前模型和空值规则明确 `resolutions` 是 list，需要统一为一种稳定结构。

除此之外，项目现场路径、adapter 配置、local-test 临时目录和清理机制均是项目或实现细节，不属于 Spec Gap。
