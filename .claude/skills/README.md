# Docs Viewer Skill - 使用指南

## 📚 快速开始

### 基本用法

```bash
# 列出所有可用文档
./docs-viewer list-docs

# 搜索文档（支持关键词）
./docs-viewer find-docs 架构
./docs-viewer find-docs 向量
./docs-viewer find-docs 数据库

# 在浏览器中打开文档
./docs-viewer open-doc architecture-tutorial
./docs-viewer open-doc langchain-vector-tutorial

# 查看文档摘要
./docs-viewer summarize-doc architecture-tutorial

# 获取学习路径推荐
./docs-viewer learn architecture
./docs-viewer learn vector
./docs-viewer learn database
```

## 🎯 可用主题

### architecture - 系统架构
学习路径：
1. complete-presentation - 完整项目概览
2. architecture-tutorial - 技术架构详解
3. architecture-diagram - 架构可视化
4. rag-architecture - RAG 架构原理

### vector - 向量数据库
学习路径：
1. langchain-vector-tutorial - LangChain 与向量数据库实战
2. rag-architecture - RAG 架构应用
3. complete-presentation - 完整项目应用

### database - 数据库
学习路径：
1. postgresql-slides - PostgreSQL 基础
2. architecture-tutorial - 数据在项目中的应用
3. complete-presentation - 完整数据流

### api - API 开发
学习路径：
1. api-documentation - API 接口文档
2. architecture-tutorial - API 架构设计
3. complete-presentation - 完整集成方案

### methodology - 编程方法论
学习路径：
1. programming-methodology - Vibe vs Spec 对比
2. complete-presentation - 实战应用

### troubleshooting - 问题排查
学习路径：
1. user-deletion-email-troubleshooting - 邮件故障排查
2. user-deletion-issue-demo - 用户删除问题分析

## 📂 文档分类

### 🏗️ 架构与设计 (4个)
- complete-presentation (93KB) - 完整讲解
- architecture-tutorial (54KB) - 架构教程
- architecture-diagram (40KB) - 架构图
- rag-architecture (55KB) - RAG 架构

### 💻 技术栈与实现 (3个)
- langchain-vector-tutorial (46KB) - LangChain 教程
- postgresql-slides (30KB) - PostgreSQL 教程
- api-documentation (55KB) - API 文档

### 🎯 方法论与最佳实践 (1个)
- programming-methodology (125KB) - 编程方法论

### 🐛 问题排查 (2个)
- user-deletion-email-troubleshooting (35KB) - 邮件故障
- user-deletion-issue-demo (26KB) - 用户删除问题

## 🔍 搜索技巧

### 支持的关键词
- **架构**: 系统设计、技术栈、流程图
- **向量**: LangChain、嵌入、向量检索
- **数据库**: PostgreSQL、SQL、表结构
- **API**: 接口、REST、认证
- **问题**: 故障、排查、解决方案
- **方法**: 编程方法论、Vibe、Spec

### 示例搜索
```bash
./docs-viewer find-docs RAG
./docs-viewer find-docs Next.js
./docs-viewer find-docs 认证
./docs-viewer find-docs 邮件
```

## 💡 使用场景

### 场景 1: 新人入职学习
```bash
# 1. 先看完整项目概览
./docs-viewer open-doc complete-presentation

# 2. 学习系统架构
./docs-viewer learn architecture

# 3. 了解技术栈
./docs-viewer learn vector
./docs-viewer learn database
```

### 场景 2: 快速查找功能文档
```bash
# 需要了解 API 接口
./docs-viewer find-docs API
./docs-viewer open-doc api-documentation

# 需要排查问题
./docs-viewer find-docs 问题
./docs-viewer open-doc user-deletion-email-troubleshooting
```

### 场景 3: 技术选型参考
```bash
# 了解架构设计
./docs-viewer open-doc architecture-tutorial

# 学习向量数据库应用
./docs-viewer open-doc langchain-vector-tutorial

# 理解编程方法论
./docs-viewer open-doc programming-methodology
```

## 🎨 文档特点

所有文档都是**交互式 HTML 演示文稿**，具有：

- ✨ 精美的视觉效果和动画
- ⌨️ 键盘导航支持（方向键切换幻灯片）
- 📱 响应式设计，支持移动设备
- 🎯 结构化的内容组织
- 🎨 现代化的 UI 设计

## 🔧 技术实现

### 文件结构
```
.claude/skills/
├── docs-viewer.md      # Skill 定义文件
├── docs-viewer.js      # 实现脚本
└── README.md           # 使用指南

docs/                   # 文档目录
├── *.html             # 10个技术文档
```

### 核心功能
1. **文档索引**: 自动扫描 docs/ 目录
2. **关键词搜索**: 在标题和主题中搜索
3. **分类系统**: 4大类自动分类
4. **浏览器集成**: 一键打开 HTML 文件
5. **学习路径**: 智能推荐学习顺序

## 🚀 未来扩展

- [ ] 添加文档评分功能
- [ ] 支持标签过滤
- [ ] 添加学习进度跟踪
- [ ] 支持导出为 PDF
- [ ] 添加全文搜索
- [ ] 支持多语言

## 📝 版本历史

- **v1.0.0** - 初始版本
  - 支持 10 个技术文档
  - 实现基本搜索和打开功能
  - 提供学习路径推荐

## 👥 贡献

欢迎添加新的技术文档或改进功能！

## 📄 许可

MIT License
