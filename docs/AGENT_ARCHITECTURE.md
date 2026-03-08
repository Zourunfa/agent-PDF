# 完整 Agent 应用架构指南

## 目录
1. [Agent 核心概念](#agent-核心概念)
2. [必备组件](#必备组件)
3. [技术架构](#技术架构)
4. [实现示例](#实现示例)
5. [最佳实践](#最佳实践)

---

## Agent 核心概念

### 什么是 Agent？

Agent 是一个能够**自主决策、使用工具、完成目标**的 AI 系统。

```
传统 AI 应用：用户提问 → AI 回答
Agent 应用：  用户目标 → AI 规划 → 使用工具 → 执行任务 → 达成目标
```

### Agent vs RAG vs Chatbot

| 特性 | Chatbot | RAG | Agent |
|------|---------|-----|-------|
| 对话能力 | ✅ | ✅ | ✅ |
| 知识检索 | ❌ | ✅ | ✅ |
| 工具调用 | ❌ | ❌ | ✅ |
| 任务规划 | ❌ | ❌ | ✅ |
| 自主决策 | ❌ | ❌ | ✅ |
| 多步骤执行 | ❌ | ❌ | ✅ |
| 反思迭代 | ❌ | ❌ | ✅ |

---

## 必备组件

### 1. 核心引擎 (Core Engine)

#### 1.1 LLM (大语言模型)
```typescript
// 推荐模型
const models = {
  reasoning: "gpt-4-turbo",      // 复杂推理
  fast: "gpt-3.5-turbo",         // 快速响应
  opensource: "llama-3-70b",     // 开源方案
  chinese: "qwen-max"            // 中文优化
};
```

**要求**：
- ✅ 支持 Function Calling
- ✅ 上下文窗口 ≥ 8K tokens
- ✅ 推理能力强
- ✅ 响应速度快

#### 1.2 决策循环 (Decision Loop)
```typescript
interface AgentLoop {
  // 1. 感知：理解当前状态
  perceive(state: State): Observation;
  
  // 2. 思考：规划下一步
  think(observation: Observation): Plan;
  
  // 3. 行动：执行计划
  act(plan: Plan): Action;
  
  // 4. 反思：评估结果
  reflect(result: Result): Feedback;
}
```

---

### 2. 工具系统 (Tool System)

#### 2.1 工具定义
```typescript
interface Tool {
  name: string;              // 工具名称
  description: string;       // 功能描述（给 LLM 看）
  parameters: JSONSchema;    // 参数定义
  execute: (params) => Promise<Result>;  // 执行函数
}

// 示例：搜索工具
const searchTool: Tool = {
  name: "search_documents",
  description: "在文档中搜索相关信息，返回最相关的段落",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "搜索关键词" },
      limit: { type: "number", description: "返回结果数量" }
    },
    required: ["query"]
  },
  execute: async ({ query, limit = 5 }) => {
    return await vectorStore.search(query, limit);
  }
};
```

#### 2.2 工具类型

**必备工具**：
1. **信息检索**
   - 向量搜索
   - 关键词搜索
   - 全文搜索

2. **数据处理**
   - 文本提取
   - 数据转换
   - 格式化

3. **外部调用**
   - API 调用
   - 数据库查询
   - 文件操作

4. **分析工具**
   - 数据分析
   - 图表生成
   - 统计计算

**扩展工具**：
- 网页爬取
- 邮件发送
- 日历管理
- 代码执行
- 图像生成

---

### 3. 记忆系统 (Memory System)

#### 3.1 短期记忆 (Short-term Memory)
```typescript
interface ShortTermMemory {
  // 当前对话上下文
  conversationHistory: Message[];
  
  // 当前任务状态
  currentTask: Task;
  
  // 已执行的操作
  actionHistory: Action[];
}
```

#### 3.2 长期记忆 (Long-term Memory)
```typescript
interface LongTermMemory {
  // 用户偏好
  userPreferences: Record<string, any>;
  
  // 历史对话摘要
  conversationSummaries: Summary[];
  
  // 学到的知识
  learnedKnowledge: Knowledge[];
  
  // 成功的策略
  successfulStrategies: Strategy[];
}
```

#### 3.3 工作记忆 (Working Memory)
```typescript
interface WorkingMemory {
  // 当前目标
  goal: string;
  
  // 子任务列表
  subtasks: Task[];
  
  // 中间结果
  intermediateResults: Map<string, any>;
  
  // 待处理项
  pendingItems: Item[];
}
```

---

### 4. 规划系统 (Planning System)

#### 4.1 任务分解
```typescript
interface TaskDecomposition {
  // 分析任务复杂度
  analyzeComplexity(task: string): Complexity;
  
  // 分解为子任务
  decompose(task: string): SubTask[];
  
  // 确定执行顺序
  orderTasks(subtasks: SubTask[]): ExecutionPlan;
}
```

#### 4.2 策略选择
```typescript
interface StrategySelector {
  // 可用策略
  strategies: {
    sequential: "顺序执行",
    parallel: "并行执行",
    conditional: "条件执行",
    iterative: "迭代执行"
  };
  
  // 选择最佳策略
  selectStrategy(task: Task): Strategy;
}
```

---

### 5. 执行引擎 (Execution Engine)

#### 5.1 工具调用
```typescript
class ToolExecutor {
  async execute(toolName: string, params: any): Promise<Result> {
    // 1. 验证工具存在
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found`);
    
    // 2. 验证参数
    this.validateParams(tool.parameters, params);
    
    // 3. 执行工具
    const result = await tool.execute(params);
    
    // 4. 记录执行
    this.logExecution(toolName, params, result);
    
    return result;
  }
}
```

#### 5.2 错误处理
```typescript
interface ErrorHandler {
  // 重试策略
  retry(action: Action, maxRetries: number): Promise<Result>;
  
  // 降级方案
  fallback(error: Error): Alternative;
  
  // 错误恢复
  recover(state: State): RecoveryPlan;
}
```

---

### 6. 反思系统 (Reflection System)

#### 6.1 结果评估
```typescript
interface ResultEvaluator {
  // 评估结果质量
  evaluate(result: Result, goal: Goal): Score;
  
  // 判断是否达成目标
  isGoalAchieved(result: Result, goal: Goal): boolean;
  
  // 识别改进空间
  identifyImprovements(result: Result): Improvement[];
}
```

#### 6.2 自我改进
```typescript
interface SelfImprovement {
  // 学习成功经验
  learnFromSuccess(action: Action, result: Result): void;
  
  // 学习失败教训
  learnFromFailure(action: Action, error: Error): void;
  
  // 优化策略
  optimizeStrategy(history: History): Strategy;
}
```

---

## 技术架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户界面 (UI)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 对话界面 │  │ 任务面板 │  │ 工具监控 │  │ 日志查看 │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Agent 核心引擎                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              决策循环 (Decision Loop)             │   │
│  │  感知 → 思考 → 规划 → 执行 → 反思 → 学习         │   │
│  └──────────────────────────────────────────────────┘   │
│                            ↓                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ 规划器   │  │ 执行器   │  │ 评估器   │  │ 学习器 │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      工具层 (Tools)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 搜索工具 │  │ 分析工具 │  │ 生成工具 │  │ 外部API  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    数据层 (Data)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 向量数据库│  │ 关系数据库│  │ 缓存层   │  │ 对象存储 │ │
│  │ Pinecone │  │PostgreSQL│  │  Redis   │  │   S3     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

### 技术栈推荐

#### 前端
```typescript
{
  framework: "Next.js 14",
  ui: "Tailwind CSS + shadcn/ui",
  state: "Zustand / Jotai",
  realtime: "WebSocket / SSE"
}
```

#### 后端
```typescript
{
  runtime: "Node.js / Bun",
  framework: "Next.js API Routes",
  agent: "LangChain / LangGraph",
  llm: "OpenAI / Anthropic / Qwen"
}
```

#### 数据存储
```typescript
{
  vector: "Pinecone / Qdrant / Weaviate",
  database: "PostgreSQL + pgvector / Supabase",
  cache: "Redis / Upstash",
  storage: "S3 / Vercel Blob"
}
```

---

## 实现示例

### 完整 Agent 实现

```typescript
// 1. Agent 类定义
class DocumentAgent {
  private llm: ChatOpenAI;
  private tools: Map<string, Tool>;
  private memory: AgentMemory;
  private planner: TaskPlanner;
  
  constructor(config: AgentConfig) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4-turbo",
      temperature: 0
    });
    
    this.tools = this.initializeTools();
    this.memory = new AgentMemory();
    this.planner = new TaskPlanner();
  }
  
  // 2. 初始化工具
  private initializeTools(): Map<string, Tool> {
    return new Map([
      ["search", {
        name: "search_documents",
        description: "搜索文档中的相关信息",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number", default: 5 }
          }
        },
        execute: async ({ query, limit }) => {
          return await this.vectorStore.search(query, limit);
        }
      }],
      
      ["summarize", {
        name: "summarize_text",
        description: "总结文本内容",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string" },
            maxLength: { type: "number", default: 200 }
          }
        },
        execute: async ({ text, maxLength }) => {
          return await this.llm.summarize(text, maxLength);
        }
      }],
      
      ["extract", {
        name: "extract_data",
        description: "从文本中提取结构化数据",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string" },
            schema: { type: "object" }
          }
        },
        execute: async ({ text, schema }) => {
          return await this.llm.extract(text, schema);
        }
      }],
      
      ["compare", {
        name: "compare_documents",
        description: "对比多个文档的内容",
        parameters: {
          type: "object",
          properties: {
            docIds: { type: "array", items: { type: "string" } }
          }
        },
        execute: async ({ docIds }) => {
          const docs = await Promise.all(
            docIds.map(id => this.loadDocument(id))
          );
          return await this.compareDocuments(docs);
        }
      }]
    ]);
  }
  
  // 3. 主执行循环
  async execute(goal: string): Promise<Result> {
    console.log(`[Agent] Starting task: ${goal}`);
    
    // 初始化状态
    let state: AgentState = {
      goal,
      completed: false,
      steps: [],
      result: null
    };
    
    // 决策循环
    let iteration = 0;
    const maxIterations = 10;
    
    while (!state.completed && iteration < maxIterations) {
      iteration++;
      console.log(`[Agent] Iteration ${iteration}`);
      
      // 1. 感知：分析当前状态
      const observation = await this.perceive(state);
      
      // 2. 思考：决定下一步
      const thought = await this.think(observation);
      
      // 3. 规划：选择工具和参数
      const plan = await this.plan(thought);
      
      // 4. 执行：调用工具
      const action = await this.act(plan);
      
      // 5. 观察：获取结果
      const result = await this.observe(action);
      
      // 6. 反思：评估是否完成
      const reflection = await this.reflect(result, state.goal);
      
      // 7. 更新状态
      state.steps.push({
        thought,
        action,
        result,
        reflection
      });
      
      state.completed = reflection.goalAchieved;
      state.result = result;
      
      // 8. 学习：记录经验
      await this.learn(state);
    }
    
    return state.result;
  }
  
  // 4. 感知
  private async perceive(state: AgentState): Promise<Observation> {
    return {
      goal: state.goal,
      completedSteps: state.steps.length,
      lastResult: state.steps[state.steps.length - 1]?.result,
      availableTools: Array.from(this.tools.keys()),
      memoryContext: await this.memory.getRelevantContext(state.goal)
    };
  }
  
  // 5. 思考
  private async think(observation: Observation): Promise<Thought> {
    const prompt = `
你是一个智能文档助手。

当前目标：${observation.goal}
已完成步骤：${observation.completedSteps}
上一步结果：${JSON.stringify(observation.lastResult)}
可用工具：${observation.availableTools.join(", ")}

请分析当前情况，思考下一步应该做什么。
`;

    const response = await this.llm.invoke(prompt);
    return {
      analysis: response.content,
      nextStep: this.parseNextStep(response.content)
    };
  }
  
  // 6. 规划
  private async plan(thought: Thought): Promise<Plan> {
    const prompt = `
基于以下思考，选择合适的工具和参数：

思考：${thought.analysis}
下一步：${thought.nextStep}

可用工具：
${Array.from(this.tools.values()).map(tool => 
  `- ${tool.name}: ${tool.description}`
).join('\n')}

请以 JSON 格式返回：
{
  "tool": "工具名称",
  "parameters": { "参数": "值" },
  "reasoning": "选择理由"
}
`;

    const response = await this.llm.invoke(prompt);
    return JSON.parse(response.content);
  }
  
  // 7. 执行
  private async act(plan: Plan): Promise<Action> {
    console.log(`[Agent] Executing: ${plan.tool}`);
    console.log(`[Agent] Parameters:`, plan.parameters);
    
    const tool = this.tools.get(plan.tool);
    if (!tool) {
      throw new Error(`Tool ${plan.tool} not found`);
    }
    
    try {
      const result = await tool.execute(plan.parameters);
      return {
        tool: plan.tool,
        parameters: plan.parameters,
        result,
        success: true
      };
    } catch (error) {
      return {
        tool: plan.tool,
        parameters: plan.parameters,
        error: error.message,
        success: false
      };
    }
  }
  
  // 8. 观察
  private async observe(action: Action): Promise<Result> {
    if (!action.success) {
      return {
        type: "error",
        content: action.error
      };
    }
    
    return {
      type: "success",
      content: action.result
    };
  }
  
  // 9. 反思
  private async reflect(
    result: Result, 
    goal: string
  ): Promise<Reflection> {
    const prompt = `
目标：${goal}
最新结果：${JSON.stringify(result)}

请评估：
1. 这个结果是否有助于达成目标？
2. 目标是否已经完成？
3. 如果未完成，还需要什么？

以 JSON 格式返回：
{
  "helpful": true/false,
  "goalAchieved": true/false,
  "nextSteps": ["步骤1", "步骤2"],
  "confidence": 0-1
}
`;

    const response = await this.llm.invoke(prompt);
    return JSON.parse(response.content);
  }
  
  // 10. 学习
  private async learn(state: AgentState): Promise<void> {
    // 记录成功的策略
    if (state.completed) {
      await this.memory.saveSuccessfulStrategy({
        goal: state.goal,
        steps: state.steps,
        result: state.result
      });
    }
    
    // 更新工具使用统计
    for (const step of state.steps) {
      await this.memory.updateToolStats(
        step.action.tool,
        step.action.success
      );
    }
  }
}

// 使用示例
const agent = new DocumentAgent({
  llm: "gpt-4-turbo",
  vectorStore: pinecone,
  memory: redis
});

const result = await agent.execute(
  "分析这3个PDF的财务数据，找出收入增长最快的公司"
);

console.log(result);
```

---

## 最佳实践

### 1. 提示词工程

#### 系统提示词
```typescript
const SYSTEM_PROMPT = `
你是一个专业的文档分析 Agent。

核心能力：
- 理解复杂的用户需求
- 分解任务为可执行的步骤
- 选择合适的工具完成任务
- 评估结果质量并迭代改进

工作原则：
1. 先思考再行动
2. 一次只做一件事
3. 验证每一步的结果
4. 遇到错误要重试或换方法
5. 完成后总结关键发现

可用工具：
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

输出格式：
{
  "thought": "我的思考过程",
  "action": "要执行的操作",
  "tool": "使用的工具",
  "parameters": { "参数": "值" }
}
`;
```

### 2. 错误处理

```typescript
class RobustAgent extends DocumentAgent {
  async executeWithRetry(
    goal: string,
    maxRetries: number = 3
  ): Promise<Result> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.execute(goal);
      } catch (error) {
        console.error(`[Agent] Attempt ${i + 1} failed:`, error);
        
        if (i === maxRetries - 1) {
          // 最后一次尝试失败，返回降级结果
          return this.fallbackStrategy(goal, error);
        }
        
        // 等待后重试
        await this.sleep(1000 * (i + 1));
      }
    }
  }
  
  private async fallbackStrategy(
    goal: string,
    error: Error
  ): Promise<Result> {
    // 降级策略：使用简单的 RAG
    return await this.simpleRAG(goal);
  }
}
```

### 3. 性能优化

```typescript
// 并行执行独立任务
async function parallelExecution(tasks: Task[]): Promise<Result[]> {
  const independentTasks = identifyIndependentTasks(tasks);
  
  return await Promise.all(
    independentTasks.map(task => agent.execute(task))
  );
}

// 缓存工具结果
class CachedAgent extends DocumentAgent {
  private cache = new Map<string, Result>();
  
  async act(plan: Plan): Promise<Action> {
    const cacheKey = this.getCacheKey(plan);
    
    if (this.cache.has(cacheKey)) {
      console.log('[Agent] Using cached result');
      return this.cache.get(cacheKey);
    }
    
    const result = await super.act(plan);
    this.cache.set(cacheKey, result);
    
    return result;
  }
}
```

### 4. 可观测性

```typescript
// 日志记录
class ObservableAgent extends DocumentAgent {
  async execute(goal: string): Promise<Result> {
    const traceId = generateTraceId();
    
    console.log(`[Trace ${traceId}] Starting task: ${goal}`);
    
    try {
      const result = await super.execute(goal);
      
      // 记录成功
      await this.logger.logSuccess({
        traceId,
        goal,
        result,
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      // 记录失败
      await this.logger.logError({
        traceId,
        goal,
        error,
        duration: Date.now() - startTime
      });
      
      throw error;
    }
  }
}

// 监控指标
interface AgentMetrics {
  totalTasks: number;
  successRate: number;
  averageDuration: number;
  toolUsageStats: Map<string, number>;
  errorRate: number;
}
```

### 5. 安全性

```typescript
// 工具权限控制
class SecureAgent extends DocumentAgent {
  private permissions: Set<string>;
  
  async act(plan: Plan): Promise<Action> {
    // 检查权限
    if (!this.hasPermission(plan.tool)) {
      throw new Error(`No permission to use tool: ${plan.tool}`);
    }
    
    // 参数验证
    this.validateParameters(plan.tool, plan.parameters);
    
    // 速率限制
    await this.checkRateLimit(plan.tool);
    
    return await super.act(plan);
  }
  
  private hasPermission(tool: string): boolean {
    return this.permissions.has(tool);
  }
}
```

---

## 评估指标

### 性能指标
- **任务完成率**：成功完成的任务比例
- **平均响应时间**：从接收任务到完成的时间
- **工具调用次数**：完成任务所需的工具调用数
- **成本效率**：每个任务的 API 调用成本

### 质量指标
- **结果准确性**：结果是否符合预期
- **用户满意度**：用户对结果的评分
- **错误率**：执行失败的比例
- **重试次数**：需要重试的次数

### 可靠性指标
- **可用性**：系统正常运行时间
- **错误恢复**：从错误中恢复的能力
- **降级策略**：在部分功能失效时的表现

---

## 参考资源

### 框架和库
- **LangChain**: https://js.langchain.com/
- **LangGraph**: https://langchain-ai.github.io/langgraph/
- **AutoGPT**: https://github.com/Significant-Gravitas/AutoGPT
- **BabyAGI**: https://github.com/yoheinakajima/babyagi

### 论文
- **ReAct**: Reasoning and Acting in Language Models
- **Reflexion**: Language Agents with Verbal Reinforcement Learning
- **Tree of Thoughts**: Deliberate Problem Solving with Large Language Models

### 教程
- OpenAI Function Calling Guide
- LangChain Agent Documentation
- Building Production-Ready AI Agents

---

## 总结

一个完整的 Agent 应用需要：

✅ **核心能力**
1. LLM 推理引擎
2. 工具调用系统
3. 记忆管理
4. 任务规划
5. 执行引擎
6. 反思学习

✅ **技术栈**
1. 前端：Next.js + React
2. 后端：LangChain + Node.js
3. 数据：向量数据库 + 关系数据库
4. 缓存：Redis
5. 存储：S3/Blob

✅ **最佳实践**
1. 提示词工程
2. 错误处理
3. 性能优化
4. 可观测性
5. 安全控制

从你当前的 RAG 应用升级到 Agent，建议：
1. 先添加 3-5 个基础工具
2. 实现简单的决策循环
3. 添加任务规划能力
4. 逐步增强反思和学习

循序渐进，每个阶段都有可用的产品！
