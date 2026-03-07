# 使用 Spec Kit 开发 PDF 聊天应用 - 完整教程

> 本教程详细记录了如何使用 GitHub Spec Kit 进行规范驱动的 PDF AI 聊天应用开发全过程。

## 目录

- [什么是 Spec Kit](#什么是-spec-kit)
- [项目初始化](#项目初始化)
- [创建项目原则](#创建项目原则)
- [定义需求规范](#定义需求规范)
- [技术方案设计](#技术方案设计)
- [任务分解](#任务分解)
- [代码实现](#代码实现)
- [项目实战案例](#项目实战案例)
- [最佳实践](#最佳实践)

---

## 什么是 Spec Kit

GitHub Spec Kit 是一个**规范驱动开发（Spec-Driven Development）**工具套件，通过以下 Slash Commands 指导开发流程：

| 指令 | 功能 | 输出 |
|------|------|------|
| `/speckit.constitution` | 创建项目原则 | `.specify/memory/constitution.md` |
| `/speckit.specify` | 定义需求 | `.specify/specs/<feature>/spec.md` |
| `/speckit.plan` | 技术方案设计 | `.specify/specs/<feature>/plan.md` |
| `/speckit.tasks` | 任务分解 | `.specify/specs/<feature>/tasks.md` |
| `/speckit.implement` | 执行实现 | 自动完成所有任务 |

**核心理念**：先明确"做什么"和"为什么"，再考虑"怎么做"。

---

## 项目初始化

### 第一步：使用 Spec Kit 初始化项目

```bash
# 直接使用 Spec Kit 创建项目框架
/speckit.init project
```

Claude Code 会引导你完成以下配置：

```
请回答以下问题来初始化项目：

1. 项目名称: agent-pdf
2. 项目描述: PDF AI 聊天应用
3. 技术栈选择:
   - 前端框架: Next.js 14
   - UI 库: Ant Design + Radix UI
   - 状态管理: React Context
   - 部署平台: Vercel

4. 功能需求:
   - PDF 上传和解析
   - 文本提取和分块
   - 向量存储和语义搜索
   - AI 对话和问答

5. 开发规范:
   - TypeScript 严格模式
   - API Route 模式
   - 无状态设计（Serverless 适配）
```

### 第二步：自动生成的项目结构

执行完成后，Spec Kit 会自动创建：

```
agent-pdf/
├── .specify/
│   ├── memory/
│   │   └── constitution.md      # 自动生成的项目原则
│   ├── specs/
│   │   └── 001-pdf-chat-app/    # 第一个功能规范
│   ├── scripts/                 # 自动化脚本
│   └── templates/               # 规范模板
├── src/
│   ├── app/
│   │   ├── api/                 # API 路由结构
│   │   └── components/          # 组件目录
│   ├── lib/                     # 业务逻辑
│   └── types/                   # TypeScript 类型
├── package.json                 # 已配置依赖
├── tsconfig.json                # TypeScript 严格模式
└── next.config.js               # Next.js 配置
```

### 已安装的核心依赖

```json
{
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "langchain": "^0.3.7",
    "@langchain/community": "^0.3.18",
    "@langchain/core": "^0.3.24",
    "pdf-parse": "^2.4.5",
    "pdf2json": "^3.1.4",
    "pdf-lib": "^1.17.1",
    "tesseract.js": "^7.0.0",
    "antd": "^6.3.1",
    "@ant-design/icons": "^6.1.0",
    "@ant-design/nextjs-registry": "^1.3.0",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "lucide-react": "^0.577.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@types/node": "^25.3.5",
    "@types/pdf-parse": "*"
  }
}
```

---

## 创建项目原则

### 执行指令

```bash
/speckit.constitution
```

### Claude Code 会引导你回答

```
请回答以下问题来创建项目原则：

1. 项目的主要目标和用户群体是什么？
2. 技术栈偏好和限制？
3. 代码质量标准？
4. 团队协作规范？
...
```

### PDF 聊天应用的 Constitution 示例

```markdown
# agent-pdf 项目原则

## 项目目标
构建一个基于 AI 的 PDF 文档智能对话系统，让用户可以通过自然语言与 PDF 文档进行交互。

## 目标用户
- 学生：快速理解学习资料
- 研究人员：高效分析学术论文
- 商务人士：处理合同、报告等文档

## 技术原则

### 技术栈
- 前端框架: Next.js 14 (App Router)
- UI 框架: Ant Design + Radix UI
- AI 集成: LangChain
- 向量数据库: 内存向量存储（开发）/ Redis（生产）
- 部署平台: Vercel Serverless

### 架构原则
- API Route 模式: 所有业务逻辑在 /app/api 中
- 服务端优先: 重计算在服务端完成
- 无状态设计: 适配 Vercel Serverless

## 代码质量标准

### TypeScript
- 启用严格模式
- 所有函数必须有类型签名
- 禁止 any 类型（特殊情况需注释说明）

### 命名规范
- 文件名: kebab-case (pdf-uploader.tsx)
- 组件名: PascalCase (PDFUploader.tsx)
- 变量名: camelCase (pdfId, textContent)

### 错误处理
- 所有 API 必须有 try-catch
- 错误信息必须包含上下文
- 用户可见的错误必须友好

## Vercel 限制适配

### 函数超时
- Hobby 计划: 10 秒
- Pro 计划: 60 秒
- 所有长时间操作必须有超时控制

### 无状态处理
- 不依赖内存存储
- 使用 Redis 持久化
- /tmp 目录不共享

## 开发规范

### Git 提交
- feat: 新功能
- fix: 修复 bug
- refactor: 重构
- docs: 文档更新

### 文件组织
- /app/api/: API 路由
- /app/components/: UI 组件
- /lib/: 业务逻辑
- /types/: TypeScript 类型定义
```

---

## 定义需求规范

### 执行指令

```bash
/speckit.specify
```

### Claude Code 会引导你

```
请描述你想要构建的功能：
```

### PDF 聊天应用的需求示例

```
我想要构建一个 PDF AI 聊天应用，用户可以上传 PDF 文件，
然后通过自然语言向文档提问。功能包括：

1. PDF 文件上传和解析
2. 文本内容提取和分块
3. 向量存储和语义搜索
4. AI 对话和问答
5. 支持多轮对话上下文

部署环境是 Vercel Serverless，需要注意函数执行时间限制。
```

### 生成的 Spec.md 结构

```markdown
# Feature: PDF AI Chat Application

## User Stories

### US-001: PDF 上传
作为用户，我想要上传 PDF 文件，以便后续与文档交互。

**验收标准**:
- 支持 PDF 格式验证
- 文件大小限制 10MB
- 显示上传进度
- 支持重新上传

### US-002: 文档解析
作为用户，我想要系统自动解析 PDF，以便提取文本内容。

**验收标准**:
- 自动提取文本内容
- 扫描文档 OCR 识别
- 显示解析进度
- 解析失败友好提示

### US-003: 智能问答
作为用户，我想要向文档提问，以便快速获取信息。

**验收标准**:
- 基于文档内容回答
- 支持多轮对话
- 显示引用来源
- 回答响应快速

## Non-Functional Requirements

- **性能**: PDF 解析 < 10 秒
- **可用性**: Vercel Serverless 兼容
- **可扩展性**: 支持并发多用户
```

---

## 技术方案设计

### 执行指令

```bash
/speckit.plan
```

### Claude Code 会引导你

```
请描述技术实现方案：
1. 前端框架选择
2. 后端架构设计
3. 数据存储方案
4. AI 模型集成
5. 部署策略
```

### PDF 聊天应用的 Plan.md 示例

```markdown
# 技术实现方案

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **UI 组件**: Ant Design + Radix UI
- **状态管理**: React Context API
- **样式**: Tailwind CSS

### 后端
- **API**: Next.js API Routes
- **PDF 解析**: pdf2json + tesseract.js (OCR)
- **AI 集成**: LangChain
- **向量存储**: MemoryVectorStore

### 存储与持久化
- **开发环境**: 内存 + /tmp 文件系统
- **生产环境**: Upstash Redis
- **原因**: Vercel Serverless 无状态限制

## 架构设计

### API 路由结构
```
/app/api/
├── upload/route.ts      # PDF 上传
├── parse/route.ts       # PDF 解析
├── chat/route.ts        # AI 对话
├── pdf/[id]/route.ts    # PDF 预览
└── manual-text/route.ts # 手动输入文本
```

### 数据流设计
```
用户上传 → 保存到 /tmp → 提取文本 → 分块 → 向量化 → Redis 存储
                                                      ↓
用户提问 ← AI 回答 ← 上下文构建 ← 向量搜索 ← Redis 读取
```

## Vercel Serverless 适配

### 挑战与解决方案

| 挑战 | 解决方案 |
|------|---------|
| 内存变量不持久 | Redis 存储所有数据 |
| 函数超时限制 | 同步解析 + 超时控制 |
| /tmp 不共享 | Redis 作为主要存储 |
| 后台任务不执行 | 在请求中同步完成 |

## 关键技术决策

### 为什么选择 Redis 而非数据库？
- Vercel 兼容性好
- HTTP API 访问，无连接池问题
- 适合键值存储场景

### 为什么同步解析？
- Vercel 无后台任务支持
- 异步任务会在响应后终止
- 10秒足够完成大部分解析

### 向量存储策略
- 开发: MemoryVectorStore (简单快速)
- 生产: 存储 embeddings 到 Redis
- 恢复: 优先使用缓存 embeddings
```

---

## 任务分解

### 执行指令

```bash
/speckit.tasks
```

### Claude Code 会自动生成

根据前面的 spec 和 plan，自动生成可执行的任务列表。

### 生成的 Tasks.md 示例

```markdown
# 实施任务清单

## Phase 1: 基础设施 (5 个任务)

- [ ] Task-001: 设置项目结构和 TypeScript 配置
- [ ] Task-002: 配置 Tailwind CSS 和 Ant Design
- [ ] Task-003: 创建基础类型定义
- [ ] Task-004: 设置 API 路由结构
- [ ] Task-005: 配置上下文 (PDF/Chat Context)

## Phase 2: PDF 上传功能 (8 个任务)

- [ ] Task-101: 创建 PDF 上传 API (/api/upload)
- [ ] Task-102: 实现文件验证逻辑
- [ ] Task-103: 实现临时文件存储
- [ ] Task-104: 创建 PDF 上传组件
- [ ] Task-105: 实现上传进度显示
- [ ] Task-106: 添加文件大小和格式验证
- [ ] Task-107: 实现错误处理和重试
- [ ] Task-108: 添加上传成功状态管理

## Phase 3: PDF 解析功能 (10 个任务)

- [ ] Task-201: 实现 pdf2json 解析器
- [ ] Task-202: 实现 OCR 识别 (tesseract.js)
- [ ] Task-203: 创建解析 API (/api/parse)
- [ ] Task-204: 实现解析状态轮询
- [ ] Task-205: 实现文本质量检测
- [ ] Task-206: 添加超时控制机制
- [ ] Task-207: 实现解析失败回退
- [ ] Task-208: 创建解析进度组件
- [ ] Task-209: 实现手动文本输入功能
- [ ] Task-210: 添加解析结果缓存

## Phase 4: 向量存储 (6 个任务)

- [ ] Task-301: 实现文本分块器
- [ ] Task-302: 配置 Qwen 嵌入模型
- [ ] Task-303: 创建向量存储服务
- [ ] Task-304: 实现向量搜索功能
- [ ] Task-305: 添加向量缓存机制
- [ ] Task-306: 实现向量存储持久化

## Phase 5: AI 对话 (8 个任务)

- [ ] Task-401: 配置 Qwen 聊天模型
- [ ] Task-402: 创建聊天 API (/api/chat)
- [ ] Task-403: 实现 SSE 流式响应
- [ ] Task-404: 实现对话上下文管理
- [ ] Task-405: 创建聊天界面组件
- [ ] Task-406: 实现消息渲染
- [ ] Task-407: 添加打字机效果
- [ ] Task-408: 实现对话历史管理

## Phase 6: Redis 持久化 (7 个任务)

- [ ] Task-501: 配置 Upstash Redis
- [ ] Task-502: 实现 PDF 数据存储
- [ ] Task-503: 实现向量数据存储
- [ ] Task-504: 实现数据恢复机制
- [ ] Task-505: 添加存储回退策略
- [ ] Task-506: 实现环境变量兼容
- [ ] Task-507: 创建存储调试工具

## Phase 7: 测试与优化 (5 个任务)

- [ ] Task-601: 添加错误边界
- [ ] Task-602: 实现性能监控
- [ ] Task-603: 优化大型 PDF 解析
- [ ] Task-604: 添加加载状态优化
- [ ] Task-605: 实现并发控制
```

---

## 代码实现

### 方式一：自动实现（推荐）

```bash
# 执行所有任务
/speckit.implement
```

Claude Code 会：
1. 按顺序执行所有任务
2. 自动创建文件
3. 实现功能代码
4. 处理依赖关系
5. 报告进度和错误

### 方式二：手动执行任务

可以一个任务一个任务地执行，Claude Code 会引导你：

```
[Task Manager] 当前有 49 个待执行任务

正在执行: Task-001: 设置项目结构和 TypeScript 配置
状态: in_progress
```

---

## 项目实战案例

### 案例 1：从零开始创建 PDF 聊天功能

#### 第 1 步：创建 Constitution

```bash
/speckit.constitution
```

回答问题：
- 项目目标：PDF AI 聊天应用
- 技术栈：Next.js + LangChain
- 部署：Vercel Serverless

#### 第 2 步：定义需求

```bash
/speckit.specify
```

输入需求：
```
实现 PDF 上传和 AI 聊天功能，用户可以：
1. 上传 PDF 文件
2. 系统自动解析
3. 向文档提问
4. 获得基于内容的回答
```

#### 第 3 步：技术方案

```bash
/speckit.plan
```

描述方案：
```
使用 Next.js API Routes，pdf2json 解析，
LangChain 集成 Qwen 模型，Redis 持久化
```

#### 第 4 步：生成任务

```bash
/speckit.tasks
```

系统自动生成任务清单。

#### 第 5 步：执行实现

```bash
/speckit.implement
```

Claude Code 自动实现所有功能。

### 案例 2：添加新功能 - 手动文本输入

#### 第 1 步：更新 Spec

```bash
/speckit.specify
```

```
添加手动文本输入功能：当 PDF 解析失败时，
用户可以手动输入或粘贴文本内容。
```

#### 第 2 步：更新 Plan

```bash
/speckit.plan
```

```
实现 /api/manual-text 端点，接收文本内容，
直接创建向量存储，跳过 PDF 解析。
```

#### 第 3 步：实现新任务

```bash
/speckit.implement
```

只实现新增的任务，不影响已有功能。

### 案例 3：修复 Redis 迁移问题

#### 问题场景

项目从 @vercel/kv 迁移到 @upstash/redis：
- 环境变量名称不同
- API 接口有差异
- JSON 序列化方式不同

#### 使用 Spec Kit 解决

```bash
# 1. 更新 spec
/speckit.specify
迁移到 @upstash/redis，解决 @vercel/kv 被弃用的问题

# 2. 更新 plan
/speckit.plan
使用 @upstash/redis SDK，支持 Vercel 集成环境变量

# 3. 生成任务
/speckit.tasks

# 4. 实现迁移
/speckit.implement
```

Claude Code 会：
1. 更新 redis-cache.ts 使用新的 SDK
2. 修改环境变量读取逻辑
3. 处理 JSON 序列化兼容性
4. 更新文档

---

## 最佳实践

### 1. Spec Kit 使用技巧

#### 明确的 "做什么"

❌ **不好的描述**：
```
优化 PDF 解析
```

✅ **好的描述**：
```
实现 PDF 解析超时控制：
- 设置 7 秒硬超时
- 超时后自动尝试 OCR
- 记录超时日志
```

#### 分阶段开发

将大功能拆分成多个小功能：

```bash
# Phase 1: 基础上传
/speckit.specify  # 定义文件上传功能
/speckit.plan
/speckit.implement

# Phase 2: 添加解析
/speckit.specify  # 定义解析功能
/speckit.plan
/speckit.implement

# Phase 3: AI 对话
/speckit.specify  # 定义对话功能
/speckit.plan
/speckit.implement
```

#### 利用 Constitution 约束

在 Constitution 中明确技术限制：

```markdown
## Vercel Serverless 限制

所有实现必须遵守：
- 函数执行时间 < 10秒
- 不依赖内存持久化
- 使用 Redis 存储状态
```

这样 Plan 和 Implement 阶段会自动考虑这些限制。

### 2. 任务管理技巧

#### 任务粒度控制

✅ **好的任务粒度**：
- 实现 PDF 文件验证（1-2小时）
- 创建上传进度组件（1小时）
- 添加 Redis 错误处理（30分钟）

❌ **不好的任务粒度**：
- 实现 PDF 功能（太模糊，需要拆分）
- 修复 bug（缺少上下文）
- 优化性能（无法衡量）

#### 任务依赖管理

Spec Kit 会自动处理依赖，但最好明确：

```markdown
## Tasks

- [ ] Task-001: 创建 PDF 类型定义
- [ ] Task-002: 实现上传 API (依赖 Task-001)
- [ ] Task-003: 创建上传组件 (依赖 Task-002)
```

### 3. 迭代开发流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Spec Kit 迭代流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /speckit.specify  →  更新需求                          │
│         ↓                                                   │
│  2. /speckit.plan      →  更新方案                          │
│         ↓                                                   │
│  3. /speckit.tasks     →  更新任务                          │
│         ↓                                                   │
│  4. /speckit.implement →  执行实现                          │
│         ↓                                                   │
│  5. 测试验证                                               │
│         ↓                                                   │
│  6. 回到步骤 1（下一个功能）                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. 常见问题处理

#### Q: Implement 时出错怎么办？

A: Spec Kit 会自动回滚和修复。如果继续失败：
```bash
# 查看错误任务
/speckit.analyze

# 修复后重新实现特定任务
# 手动告诉 Claude Code 执行特定任务
```

#### Q: 如何中途修改需求？

A: 随时可以更新 Spec：
```bash
/speckit.specify  # 添加新需求或修改现有需求
```

然后重新运行 Plan 和 Tasks。

#### Q: 如何跳过某些任务？

A: 在 tasks.md 中注释掉：
```markdown
# - [ ] Task-xxx: 暂时跳过
```

---

## 附录

### Spec Kit 目录结构

```
.specify/
├── memory/
│   └── constitution.md       # 项目原则
├── specs/
│   ├── 001-pdf-chat-app/     # 功能 1
│   │   ├── spec.md           # 需求规范
│   │   ├── plan.md           # 技术方案
│   │   └── tasks.md          # 任务清单
│   ├── 002-redis-persistence/ # 功能 2
│   └── ...
├── scripts/                  # 自动化脚本
└── templates/                # 规范模板
```

### 本项目 Spec Kit 使用记录

```bash
# 2025-03-05: 项目初始化
/speckit.constitution  # 创建项目原则

# 2025-03-06: 核心功能开发
/speckit.specify      # 定义 PDF 聊天功能
/speckit.plan         # 设计技术方案
/speckit.tasks        # 生成 49 个任务
/speckit.implement    # 自动实现

# 2025-03-06: 添加 OCR 功能
/speckit.specify      # 添加扫描文档处理需求
/speckit.implement    # 实现 OCR 集成

# 2025-03-07: Redis 迁移
/speckit.specify      # 迁移到 @upstash/redis
/speckit.plan         # 设计迁移方案
/speckit.implement    # 执行迁移
```

---

*文档版本: 1.0.0*
*最后更新: 2025-03-07*
*适用于: agent-pdf 项目*
