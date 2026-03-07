# PDF AI Chat

**一个基于 Next.js 14 和 LangChain 的 PDF AI 对话 Web 应用。**
视频地址：https://www.bilibili.com/video/BV1RC1GB6EUi/?spm_id_from=333.1387.homepage.video_card.click
**访问地址**: [little-agent-pdf.vercel.app)

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

### P0 (高优先级)
1. 用户登录功能 - 多用户支持的基础
2. IndexedDB 存储 - 提升用户体验
3. 对话历史管理 - 核心功能增强

### P1 (中优先级)
1. 多文档格式支持 - 扩大使用场景
2. 批量上传 - 提升效率
3. 对话导出 - 数据可移植性

### P2 (低优先级)
1. 主题切换 - UI 美化
2. 国际化 - 市场扩展
3. 商业化功能 - 盈利模式

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系

如有问题或建议，请提交 Issue。
