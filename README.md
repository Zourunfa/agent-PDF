# PDF AI Chat
一个基于 Next.js 14 和 LangChain 的 PDF AI 对话 Web 应用。
链接：little-agent-pdf.vercel.app

## 功能

- 上传 PDF 文件（最大 10MB）
- 自动解析 PDF 内容并提取文本
- 基于 PDF 内容的 AI 智能问答
- 多轮对话支持
- Markdown 格式渲染
- 响应式设计

## 技术栈

- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **AI**: LangChain.js, OpenAI GPT
- **PDF 处理**: pdf-parse

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
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
MAX_FILE_SIZE=10485760
```

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
│   └── ...
├── components/       # React 组件
│   ├── chat/         # 对话组件
│   ├── layout/       # 布局组件
│   ├── pdf/          # PDF 组件
│   └── ui/           # UI 组件
├── lib/              # 工具库
│   ├── chat/         # 对话工具
│   ├── langchain/    # LangChain 配置
│   ├── pdf/          # PDF 处理
│   ├── storage/      # 存储工具
│   └── utils/        # 通用工具
├── types/            # TypeScript 类型
└── contexts/         # React Context
```

## License

MIT
