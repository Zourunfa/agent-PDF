# PDF AI Chat

**一个基于 Next.js 14 和 LangChain 的 PDF AI 对话 Web 应用。**
**访问地址**: [little-agent-pdf.vercel.app]
视频地址：


## 功能

- 上传 PDF 文件（最大 1MB）
- 自动解析 PDF 内容并提取文本
- 基于 PDF 内容的 AI 智能问答
- 多轮对话支持
- Markdown 格式渲染
- 响应式设计

## 技术栈

- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Ant Design
- **AI**: LangChain.js, Alibaba Tongyi Qwen
- **向量数据库**: Pinecone (推荐) 或 内存存储
- **缓存**: Upstash Redis
- **PDF 处理**: pdf2json, tesseract.js (OCR)

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
npm install
```

### 配置

创建 `.env.local` 文件：

```env
# AI 配置（必需）
ALIBABA_API_KEY=sk-your-alibaba-api-key-here

# Pinecone 向量数据库（推荐）
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_INDEX_NAME=pdf-chat

# Upstash Redis（必需）
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token
```

**获取 API Keys:**
- Alibaba Tongyi: https://dashscope.aliyun.com/
- Pinecone: https://www.pinecone.io/ (免费版：100K 向量)
- Upstash Redis: https://upstash.com/ (免费版：256MB)

**详细设置指南**: 查看 [PINECONE_SETUP.md](./PINECONE_SETUP.md)

### 运行

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 构建

```bash
npm run build
npm start
```

## 测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e
```

## 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API Routes
│   │   ├── upload/   # PDF 上传
│   │   ├── parse/    # PDF 解析
│   │   └── chat/     # AI 对话
│   └── ...
├── components/       # React 组件
│   ├── chat/         # 对话组件
│   ├── layout/       # 布局组件
│   ├── pdf/          # PDF 组件
│   └── ui/           # UI 组件
├── lib/              # 工具库
│   ├── langchain/    # LangChain 配置
│   ├── pinecone/     # Pinecone 向量存储
│   ├── pdf/          # PDF 处理
│   ├── storage/      # Redis 存储
│   └── utils/        # 通用工具
├── types/            # TypeScript 类型
└── contexts/         # React Context
```

## 架构说明

### 存储架构

```
┌─────────────────────────────────────────────────────────┐
│  三层存储架构                                            │
└─────────────────────────────────────────────────────────┘

1. Pinecone (向量数据库)
   ├─ 向量嵌入 (embeddings)
   ├─ 持久化存储
   └─ 高性能相似度搜索

2. Redis (Upstash)
   ├─ PDF 元数据
   ├─ 文本内容
   └─ 文本 chunks

3. 内存缓存
   ├─ 单次请求快速访问
   └─ 请求结束后清空
```

### 数据流程

```
上传 PDF → 解析文本 → 分块 → 生成向量 → 存储到 Pinecone
                                    ↓
用户提问 → 向量化 → Pinecone 搜索 → 获取相关文档 → AI 生成回答
```

**详细架构**: 查看 [docs/ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)
import { Pinecone } from '@pinecone-database/pinecone';
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('pdf-chat');

// 3. 存储向量
await index.upsert([{
  id: `${pdfId}-chunk-${i}`,
  values: embedding,
  metadata: { pdfId, content: chunk.content }
}]);

// 4. 搜索
const results = await index.query({
  vector: queryEmbedding,
  topK: 4,
  filter: { pdfId: { $eq: pdfId } }
});
优点：

✅ 完全托管，无需维护
✅ 免费版：1个索引，100K向量
✅ 性能极好
✅ LangChain 原生支持
成本：

免费版：足够个人项目
付费版：$70/月起
方案 B: Supabase + pgvector (免费) ⭐⭐⭐⭐
// 1. 创建表
create table documents (
  id bigserial primary key,
  pdf_id text,
  content text,
  embedding vector(1536)
);

// 2. 创建索引
create index on documents using ivfflat (embedding vector_cosine_ops);

// 3. 存储
await supabase.from('documents').insert({
  pdf_id: pdfId,
  content: chunk.content,
  embedding: embedding
});

// 4. 搜索
const { data } = await supabase.rpc('match_documents', {
  query_embedding: queryEmbedding,
  match_threshold: 0.7,
  match_count: 4
});
优点：

✅ 完全免费（500MB 数据库）
✅ 关系型数据库 + 向量搜索
✅ 可以存储用户、PDF 元数据等
✅ 实时订阅、认证等功能
方案 C: Upstash Redis + 文本存储 (折中) ⭐⭐⭐
// 只存储文本chunks，不存储向量
// 每次搜索时重新计算（适合小规模）

// 1. 存储chunks
await redis.set(`chunks:${pdfId}`, chunks);

// 2. 搜索时
const chunks = await redis.get(`chunks:${pdfId}`);
const embeddings = await generateEmbeddings(chunks); // 重新计算
const vectorStore = await MemoryVectorStore.fromDocuments(
  chunks, embeddings
);
优点：

✅ 利用现有 Redis
✅ 避免每次重新解析 PDF
✅ 简单

## License

MIT

---

## 📋 TODO List

### 🔐 用户认证功能
- [ ] 用户注册/登录系统
  - [ ] 邮箱 + 密码登录
  - [ ] OAuth 第三方登录（Google, GitHub）
  - [ ] JWT Token 认证
  - [ ] 用户会话管理
- [ ] 用户权限管理
  - [ ] 普通用户 vs 高级用户
  - [ ] 上传文件数量限制
  - [ ] API 调用频率限制
- [ ] 用户个人中心
  - [ ] 个人资料编辑
  - [ ] 密码修改
  - [ ] 使用统计查看

### 💾 IndexedDB 本地存储
- [ ] PDF 文件本地缓存
  - [ ] 使用 IndexedDB 存储 PDF 二进制数据
  - [ ] 离线访问已上传的 PDF
  - [ ] 自动清理过期缓存
- [ ] 对话历史本地存储
  - [ ] 保存聊天记录到 IndexedDB
  - [ ] 跨会话恢复对话
  - [ ] 导出对话记录
- [ ] 向量数据本地缓存
  - [ ] 缓存 embeddings 避免重复计算
  - [ ] 加速相似度搜索

### 🚀 推荐新增功能

#### 📄 PDF 处理增强
- [ ] 支持更多文档格式
  - [ ] Word (.docx, .doc)
  - [ ] Excel (.xlsx, .xls)
  - [ ] PowerPoint (.pptx, .ppt)
  - [ ] Markdown (.md)
  - [ ] 纯文本 (.txt)
- [ ] PDF 批量上传
  - [ ] 拖拽多个文件
  - [ ] 文件夹上传
  - [ ] 批量解析队列
- [ ] PDF 预处理
  - [ ] 自动去除水印
  - [ ] 图片提取和 OCR
  - [ ] 表格识别和提取
  - [ ] 页面旋转和裁剪

#### 💬 对话功能增强
- [ ] 多模态对话
  - [ ] 支持图片问答
  - [ ] 支持语音输入
  - [ ] 支持语音输出（TTS）
- [ ] 对话管理
  - [ ] 创建多个对话会话
  - [ ] 对话重命名
  - [ ] 对话分享（生成链接）
  - [ ] 对话导出（PDF/Markdown）
- [ ] 智能功能
  - [ ] 自动生成文档摘要
  - [ ] 关键信息提取
  - [ ] 文档对比分析
  - [ ] 多文档联合问答

#### 🎨 UI/UX 优化
- [ ] 主题切换
  - [ ] 亮色/暗色模式
  - [ ] 自定义主题色
  - [ ] 字体大小调节
- [ ] 响应式优化
  - [ ] 移动端适配
  - [ ] 平板端优化
  - [ ] PWA 支持
- [ ] 交互优化
  - [ ] 快捷键支持
  - [ ] 拖拽排序
  - [ ] 右键菜单
  - [ ] 搜索高亮

#### 🔧 技术优化
- [ ] 性能优化
  - [ ] 虚拟滚动（大文件）
  - [ ] 懒加载
  - [ ] 代码分割
  - [ ] CDN 加速
- [ ] 数据持久化
  - [ ] PostgreSQL 数据库
  - [ ] S3 对象存储
  - [ ] Redis 缓存优化
- [ ] 监控和日志
  - [ ] 错误追踪（Sentry）
  - [ ] 性能监控
  - [ ] 用户行为分析
  - [ ] API 调用统计

#### 🤝 协作功能
- [ ] 团队协作
  - [ ] 文档共享
  - [ ] 协作标注
  - [ ] 评论功能
  - [ ] 权限管理
- [ ] 知识库
  - [ ] 文档分类
  - [ ] 标签系统
  - [ ] 全文搜索
  - [ ] 收藏夹

#### 🌐 国际化
- [ ] 多语言支持
  - [ ] 中文
  - [ ] 英文
  - [ ] 日文
  - [ ] 韩文
- [ ] 时区处理
- [ ] 货币格式化

#### 💰 商业化功能
- [ ] 订阅系统
  - [ ] 免费版 / 专业版 / 企业版
  - [ ] Stripe 支付集成
  - [ ] 发票管理
- [ ] 使用配额
  - [ ] 文件上传限制
  - [ ] API 调用限制
  - [ ] 存储空间限制
- [ ] 推荐奖励
  - [ ] 邀请码系统
  - [ ] 积分系统

#### 🔒 安全增强
- [ ] 数据加密
  - [ ] 文件加密存储
  - [ ] 传输加密（HTTPS）
  - [ ] 敏感信息脱敏
- [ ] 访问控制
  - [ ] IP 白名单
  - [ ] 设备管理
  - [ ] 异常登录检测
- [ ] 合规性
  - [ ] GDPR 合规
  - [ ] 数据导出
  - [ ] 数据删除

#### 📊 数据分析
- [ ] 使用统计
  - [ ] 上传文件统计
  - [ ] 对话次数统计
  - [ ] 用户活跃度
- [ ] 可视化报表
  - [ ] 使用趋势图
  - [ ] 热门问题分析
  - [ ] 用户留存率

---

## 🎯 优先级建议
升级Agent路径
阶段 1: 基础 Agent (1-2周)
 集成 LangChain Agent 框架
 添加 3-5 个基础工具
 实现简单的决策循环
 添加工具调用日志
阶段 2: 增强 Agent (2-3周)
 实现 ReAct 模式
 添加任务规划能力
 支持多步骤任务
 添加错误重试机制
阶段 3: 高级 Agent (3-4周)
 多 Agent 协作
 自主学习和优化
 复杂任务分解
 人机协作界面

### 🤖 LangGraph ReAct Agent 智能体

#### 什么是 ReAct Agent？
ReAct (Reasoning + Acting) 是一种结合推理和行动的 AI Agent 模式，能够：
- **自主思考**：分析问题，制定计划
- **工具调用**：根据需要调用外部工具
- **反思优化**：根据结果调整策略
- **多步执行**：完成复杂的多步骤任务

#### 技术架构
```typescript
// LangGraph 状态图
┌─────────────┐
│   开始      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  推理节点   │ ← 分析问题，决定下一步
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  工具节点   │ ← 调用工具（搜索、计算等）
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  反思节点   │ ← 评估结果，是否继续
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   结束      │
└─────────────┘
```

#### 实现计划

##### 阶段 1: 基础 Agent (1-2周) ⭐
- [ ] **安装依赖**
  ```bash
  npm install @langchain/langgraph @langchain/core
  ```

- [ ] **创建 Agent 核心**
  - [ ] 定义状态类型（State Schema）
  - [ ] 实现推理节点（Reasoning Node）
  - [ ] 实现工具节点（Tool Node）
  - [ ] 构建状态图（State Graph）

- [ ] **集成基础工具**
  - [ ] PDF 搜索工具（从向量库检索）
  - [ ] 文档摘要工具
  - [ ] 计算器工具
  - [ ] 网络搜索工具（可选）

- [ ] **API 路由**
  ```typescript
  // src/app/api/agent/route.ts
  POST /api/agent
  {
    "pdfId": "xxx",
    "query": "分析这份文档的关键信息",
    "mode": "react" // react | simple
  }
  ```

##### 阶段 2: 增强 Agent (2-3周) ⭐⭐
- [ ] **ReAct 模式实现**
  - [ ] Thought（思考）：分析当前状态
  - [ ] Action（行动）：选择并执行工具
  - [ ] Observation（观察）：记录执行结果
  - [ ] Reflection（反思）：评估是否达成目标

- [ ] **任务规划能力**
  - [ ] 复杂任务分解
  - [ ] 子任务优先级排序
  - [ ] 并行任务执行

- [ ] **错误处理**
  - [ ] 工具调用失败重试
  - [ ] 超时处理
  - [ ] 降级策略

- [ ] **可视化界面**
  - [ ] 显示 Agent 思考过程
  - [ ] 工具调用日志
  - [ ] 执行步骤时间线

##### 阶段 3: 高级 Agent (3-4周) ⭐⭐⭐
- [ ] **多 Agent 协作**
  - [ ] 文档分析 Agent
  - [ ] 数据提取 Agent
  - [ ] 报告生成 Agent
  - [ ] Agent 间通信协议

- [ ] **自主学习**
  - [ ] 记录成功/失败案例
  - [ ] 优化工具选择策略
  - [ ] Few-shot 学习

- [ ] **人机协作**
  - [ ] 人工确认关键步骤
  - [ ] 中途干预和调整
  - [ ] 反馈循环

#### 代码示例

```typescript
// src/lib/agent/react-agent.ts
import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// 定义状态
interface AgentState {
  messages: Message[];
  currentThought: string;
  toolCalls: ToolCall[];
  finalAnswer?: string;
}

// 推理节点
async function reasoningNode(state: AgentState) {
  const llm = new ChatOpenAI({ model: "gpt-4" });
  const thought = await llm.invoke([
    { role: "system", content: "你是一个智能助手，需要分析问题并决定下一步行动" },
    ...state.messages
  ]);
  
  return {
    ...state,
    currentThought: thought.content,
  };
}

// 工具节点
async function toolNode(state: AgentState) {
  const tools = {
    searchPDF: async (query: string) => {
      // 从向量库搜索
      return await searchSimilarDocuments(pdfId, query);
    },
    summarize: async (text: string) => {
      // 生成摘要
      return await generateSummary(text);
    }
  };
  
  // 执行工具调用
  const results = await executeTools(state.toolCalls, tools);
  
  return {
    ...state,
    messages: [...state.messages, ...results]
  };
}

// 构建状态图
const workflow = new StateGraph<AgentState>({
  channels: {
    messages: { value: (x, y) => x.concat(y) },
    currentThought: { value: (x, y) => y ?? x },
    toolCalls: { value: (x, y) => y ?? x },
    finalAnswer: { value: (x, y) => y ?? x }
  }
});

workflow.addNode("reasoning", reasoningNode);
workflow.addNode("tools", toolNode);
workflow.addNode("reflect", reflectNode);

workflow.addEdge("reasoning", "tools");
workflow.addEdge("tools", "reflect");
workflow.addConditionalEdges(
  "reflect",
  (state) => state.finalAnswer ? "end" : "reasoning"
);

workflow.setEntryPoint("reasoning");

const agent = workflow.compile();
```

#### 使用场景

1. **智能文档分析**
   - 用户：「帮我分析这份合同的风险点」
   - Agent：
     1. 思考：需要提取合同条款
     2. 行动：调用 PDF 搜索工具
     3. 观察：找到 5 个关键条款
     4. 思考：需要分析法律风险
     5. 行动：调用风险分析工具
     6. 反思：已完成分析
     7. 输出：风险报告

2. **多文档对比**
   - 用户：「对比这两份报告的差异」
   - Agent：
     1. 分解任务：提取文档 A → 提取文档 B → 对比
     2. 并行执行：同时分析两份文档
     3. 汇总结果：生成对比报告

3. **复杂问答**
   - 用户：「这份财报显示的利润率是多少？比去年增长了多少？」
   - Agent：
     1. 提取当前利润率
     2. 搜索去年数据
     3. 计算增长率
     4. 生成回答

#### 技术优势

| 特性 | 当前 RAG | ReAct Agent |
|------|---------|-------------|
| 问答能力 | ✅ 单次检索 | ✅ 多步推理 |
| 复杂任务 | ❌ 不支持 | ✅ 任务分解 |
| 工具调用 | ❌ 无 | ✅ 多工具协作 |
| 自主性 | ❌ 被动响应 | ✅ 主动规划 |
| 可解释性 | ⚠️ 黑盒 | ✅ 透明过程 |

#### 参考资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [ReAct 论文](https://arxiv.org/abs/2210.03629)
- [LangChain Agent 教程](https://js.langchain.com/docs/modules/agents/)

---

### P0 (高优先级)
1. **LangGraph ReAct Agent** - 核心智能体升级 🔥
2. 用户登录功能 - 多用户支持的基础
3. IndexedDB 存储 - 提升用户体验
4. 对话历史管理 - 核心功能增强


### P1 (中优先级)
1. Agent 可视化界面 - 展示思考过程
2. 多文档格式支持 - 扩大使用场景
3. 批量上传 - 提升效率
4. 对话导出 - 数据可移植性

### P2 (低优先级)
1. 多 Agent 协作 - 高级功能
2. 主题切换 - UI 美化
3. 国际化 - 市场扩展
4. 商业化功能 - 盈利模式

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系

如有问题或建议，请提交 Issue。
