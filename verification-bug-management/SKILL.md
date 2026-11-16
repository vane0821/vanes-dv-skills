---
name: verification-bug-management
description: 定义、重建、使用或审查验证环境的 Git/YAML Bug Tool，覆盖 Bug 生命周期、现场采集、CLI、查询、summary、多人 Git transaction 与并发行为；不用于自动判重或 owner/assignee 流程。
---

# Verification Bug Management

## 目标

为一个 verification environment 提供多人共享的 Bug 管理能力。每位工程师使用自己的 working copy，通过共享 Git remote 协作；Tool 负责 Bug 生命周期、execution snapshot、分析记录、关闭、查询和派生视图。

实现、修改或审查 Bug Tool 时，必须先读取 [knowledge/bug-management-model.md](knowledge/bug-management-model.md)。该文件是当前完整能力规格和 reconstruction acceptance 的权威定义。

## 核心模型

```text
bug_db/
├── bugs/
│   └── BUG-xxxx.yaml
└── summary.csv
```

- `bugs/*.yaml`：每个 Bug 一个 record，是 Bug 数据的唯一 Source of Truth。
- `summary.csv`：仅由 YAML 自动生成、可完整重建的 derived global view，不参与单次 Bug write transaction。
- 历史 event 采用 append-only；当前属性只按规格允许的操作更新。

Bug record：

```text
Bug
├── current attributes: bug_id, status, module, type[], fail_info
├── occurrences[]
├── analyses[]
├── escape_analyses[]
└── resolutions[]
```

## 正式能力

正式 CLI 为 `bsubmit`、`banalyze`、`bescape`、`bclose`、`bsearch`、`bshow`、`bsummary`、`bhelp`。`bsummary` 从 YAML 重建 `summary.csv`，不负责 Daily Report。所有需要 Bug DB 的业务命令都支持 `--local-test`；`bhelp` 和 `bsnapshot` 不访问 Bug DB。

## 不变量

- `fail_info` 表示发生了什么，`analysis` 表示为什么发生，`escape_analysis` 表示为什么此前没有发现或避免。
- `status` 只有 `open`、`closed`；不增加 `fixing`、`verifying` 或独立 `bfix`、`bverify`。
- duplicate / Existing Bug 由人判断，不做自动 similarity matching。
- 不增加 owner、assignee 或无业务意义的 available/valid/enabled 控制字段。
- Git、仿真现场可取得的事实自动采集，不要求人工重复输入。
- 外部 view 或 notification 不能反向成为 Bug 数据源。

## Pending 扩展

Feishu Notification 尚未成为当前 Bug Tool 能力。它只能作为 Bug transaction 成功后的非强依赖 side effect；详细方案不在当前规格中定义。
