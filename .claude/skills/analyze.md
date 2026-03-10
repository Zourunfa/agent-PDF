---
description: 在任务生成后对 spec.md、plan.md 和 tasks.md 进行非破坏性的跨文档一致性和质量分析。
scripts:
  sh: scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
  ps: scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，你**必须**考虑用户输入（如果不为空）。

## 目标

在实施之前，识别三个核心文档（`spec.md`、`plan.md`、`tasks.md`）中的不一致、重复、歧义和未充分说明的项目。此命令必须仅在 `/speckit.tasks` 成功生成完整的 `tasks.md` 后运行。

## 操作约束

**严格只读**：**不要**修改任何文件。输出结构化的分析报告。提供可选的修复计划（用户必须明确批准后才能手动调用任何后续编辑命令）。

**章程权威**：项目章程（`/memory/constitution.md`）在此分析范围内是**不可协商的**。章程冲突自动为关键级别，需要调整规范、计划或任务——而不是稀释、重新解释或默默忽略原则。如果原则本身需要更改，必须在 `/speckit.analyze` 之外进行单独的、明确的章程更新。

## 执行步骤

### 1. 初始化分析上下文

从仓库根目录运行一次 `{SCRIPT}` 并解析 JSON 以获取 FEATURE_DIR 和 AVAILABLE_DOCS。派生绝对路径：

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

如果缺少任何必需文件，则中止并显示错误消息（指示用户运行缺少的先决条件命令）。
对于参数中的单引号，如 "I'm Groot"，使用转义语法：例如 'I'\''m Groot'（或者如果可能，使用双引号："I'm Groot"）。

### 2. 加载文档（渐进式披露）

仅从每个文档加载最少必要的上下文：

**从 spec.md：**

- 概述/上下文
- 功能需求
- 非功能需求
- 用户故事
- 边缘情况（如果存在）

**从 plan.md：**

- 架构/技术栈选择
- 数据模型引用
- 阶段
- 技术约束

**从 tasks.md：**

- 任务 ID
- 描述
- 阶段分组
- 并行标记 [P]
- 引用的文件路径

**从章程：**

- 加载 `/memory/constitution.md` 进行原则验证

### 3. 构建语义模型

创建内部表示（不要在输出中包含原始文档）：

- **需求清单**：每个功能性和非功能性需求都有一个稳定的键（基于命令式短语派生 slug；例如，"用户可以上传文件" → `user-can-upload-file`）
- **用户故事/操作清单**：具有验收标准的离散用户操作
- **任务覆盖映射**：将每个任务映射到一个或多个需求或故事（通过关键字推断/显式引用模式，如 ID 或关键短语）
- **章程规则集**：提取原则名称和 MUST/SHOULD 规范性声明

### 4. Detection Passes (Token-Efficient Analysis)

Focus on high-signal findings. Limit to 50 findings total; aggregate remainder in overflow summary.

#### A. Duplication Detection

- Identify near-duplicate requirements
- Mark lower-quality phrasing for consolidation

#### B. Ambiguity Detection

- Flag vague adjectives (fast, scalable, secure, intuitive, robust) lacking measurable criteria
- Flag unresolved placeholders (TODO, TKTK, ???, `<placeholder>`, etc.)

#### C. Underspecification

- Requirements with verbs but missing object or measurable outcome
- User stories missing acceptance criteria alignment
- Tasks referencing files or components not defined in spec/plan

#### D. Constitution Alignment

- Any requirement or plan element conflicting with a MUST principle
- Missing mandated sections or quality gates from constitution

#### E. Coverage Gaps

- Requirements with zero associated tasks
- Tasks with no mapped requirement/story
- Non-functional requirements not reflected in tasks (e.g., performance, security)

#### F. Inconsistency

- Terminology drift (same concept named differently across files)
- Data entities referenced in plan but absent in spec (or vice versa)
- Task ordering contradictions (e.g., integration tasks before foundational setup tasks without dependency note)
- Conflicting requirements (e.g., one requires Next.js while other specifies Vue)

### 5. Severity Assignment

Use this heuristic to prioritize findings:

- **CRITICAL**: Violates constitution MUST, missing core spec artifact, or requirement with zero coverage that blocks baseline functionality
- **HIGH**: Duplicate or conflicting requirement, ambiguous security/performance attribute, untestable acceptance criterion
- **MEDIUM**: Terminology drift, missing non-functional task coverage, underspecified edge case
- **LOW**: Style/wording improvements, minor redundancy not affecting execution order

### 6. Produce Compact Analysis Report

Output a Markdown report (no file writes) with the following structure:

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Two similar requirements ... | Merge phrasing; keep clearer version |

(Add one row per finding; generate stable IDs prefixed by category initial.)

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution Alignment Issues:** (if any)

**Unmapped Tasks:** (if any)

**Metrics:**

- Total Requirements
- Total Tasks
- Coverage % (requirements with >=1 task)
- Ambiguity Count
- Duplication Count
- Critical Issues Count

### 7. Provide Next Actions

At end of report, output a concise Next Actions block:

- If CRITICAL issues exist: Recommend resolving before `/speckit.implement`
- If only LOW/MEDIUM: User may proceed, but provide improvement suggestions
- Provide explicit command suggestions: e.g., "Run /speckit.specify with refinement", "Run /speckit.plan to adjust architecture", "Manually edit tasks.md to add coverage for 'performance-metrics'"

### 8. Offer Remediation

Ask the user: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply them automatically.)

## Operating Principles

### Context Efficiency

- **Minimal high-signal tokens**: Focus on actionable findings, not exhaustive documentation
- **Progressive disclosure**: Load artifacts incrementally; don't dump all content into analysis
- **Token-efficient output**: Limit findings table to 50 rows; summarize overflow
- **Deterministic results**: Rerunning without changes should produce consistent IDs and counts

### Analysis Guidelines

- **NEVER modify files** (this is read-only analysis)
- **NEVER hallucinate missing sections** (if absent, report them accurately)
- **Prioritize constitution violations** (these are always CRITICAL)
- **Use examples over exhaustive rules** (cite specific instances, not generic patterns)
- **Report zero issues gracefully** (emit success report with coverage statistics)

## Context

{ARGS}
