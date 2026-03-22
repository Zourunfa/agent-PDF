# Docs Viewer - 项目技术文档快速查看器

## 描述

快速查找和打开 Agent-PDF 项目的技术演示文档（HTML 格式的 PPT）。支持关键词搜索、分类浏览和文档摘要。

## 使用场景

- 快速查找某个功能的技术文档
- 学习项目架构和技术栈
- 查看编程方法论对比
- 了解 RAG 架构和向量数据库
- 排查问题和故障解决

## 可用文档列表

### 🏗️ 架构与设计
- **complete-presentation** (93KB) - Agent-PDF 完整讲解文稿
- **architecture-tutorial** (54KB) - PDF AI 聊天应用技术架构教程
- **architecture-diagram** (40KB) - Agent-PDF 技术架构图
- **rag-architecture** (55KB) - RAG 架构原理图

### 💻 技术栈与实现
- **langchain-vector-tutorial** (46KB) - LangChain 与向量数据库实战教程
- **postgresql-slides** (30KB) - PostgreSQL 数据库教程
- **api-documentation** (55KB) - PDF AI Chat API 接口文档

### 🎯 方法论与最佳实践
- **programming-methodology** (125KB) - 编程方法论对比：Vibe Coding vs Spec Coding

### 🐛 问题排查
- **user-deletion-email-troubleshooting** (35KB) - 用户删除和邮件发送故障排查演示
- **user-deletion-issue-demo** (26KB) - 用户删除功能问题分析与解决方案演示

## 命令

### /list-docs
列出所有可用的技术文档，包括文件名、大小和主题分类。

**示例**:
```
/list-docs
```

**输出**:
```
📚 Agent-PDF 技术文档列表

🏗️ 架构与设计:
  • complete-presentation (93KB) - 完整讲解文稿
  • architecture-tutorial (54KB) - 技术架构教程
  • architecture-diagram (40KB) - 技术架构图
  • rag-architecture (55KB) - RAG 架构原理

💻 技术栈与实现:
  • langchain-vector-tutorial (46KB) - LangChain 与向量数据库
  • postgresql-slides (30KB) - PostgreSQL 教程
  • api-documentation (55KB) - API 接口文档

🎯 方法论与最佳实践:
  • programming-methodology (125KB) - 编程方法论对比

🐛 问题排查:
  • user-deletion-email-troubleshooting (35KB) - 邮件故障排查
  • user-deletion-issue-demo (26KB) - 用户删除问题分析
```

### /find-docs <关键词>
根据关键词搜索相关文档。支持模糊搜索。

**参数**:
- `关键词` - 搜索词，如：架构、向量、数据库、API、问题排查

**示例**:
```
/find-docs 架构
/find-docs 向量
/find-docs 数据库
/find-docs API
/find-docs 问题
```

### /open-doc <文档名称>
在浏览器中打开指定的技术文档。

**参数**:
- `文档名称` - HTML 文件名（不含 .html 后缀）

**示例**:
```
/open-doc architecture-tutorial
/open-doc langchain-vector-tutorial
/open-doc postgresql-slides
/open-doc programming-methodology
```

### /summarize-doc <文档名称>
显示指定文档的内容摘要和主要章节。

**参数**:
- `文档名称` - HTML 文件名（不含 .html 后缀）

**示例**:
```
/summarize-doc architecture-tutorial
/summarize-doc langchain-vector-tutorial
```

### /learn <主题>
根据主题推荐相关文档并提供学习路径。

**支持的主题**:
- `architecture` - 系统架构
- `vector` - 向量数据库
- `rag` - RAG 架构
- `database` - 数据库
- `api` - API 开发
- `methodology` - 编程方法论
- `troubleshooting` - 问题排查

**示例**:
```
/learn architecture
/learn vector
/learn database
```

## 实现逻辑

1. **文档索引**：读取 `docs/` 目录下所有 HTML 文件
2. **关键词提取**：从文件名和标题中提取关键词
3. **分类系统**：根据内容将文档分为架构、技术栈、方法论、问题排查四类
4. **搜索算法**：使用关键词匹配和相关性排序
5. **打开方式**：使用系统默认浏览器打开 HTML 文件
6. **摘要生成**：解析 HTML 内容提取标题和章节结构

## 文件路径

所有文档位于 `docs/` 目录：
- 相对路径：`docs/<filename>.html`
- 绝对路径：`/Users/a1804491927/Code/open-source/agent-PDF/docs/<filename>.html`

## 浏览器打开命令

使用以下命令在浏览器中打开文档：
```bash
open docs/<filename>.html  # macOS
```

## 注意事项

1. 所有文档都是交互式 HTML 演示文稿
2. 使用键盘方向键或点击按钮可以切换幻灯片
3. 部分文档包含动画效果，建议在浏览器中查看
4. 文档大小从 26KB 到 125KB 不等

## 相关命令

如果需要创建新的技术文档，可以使用：
- `/create-presentation <主题>` - 创建新的演示文稿
- `/update-doc-index` - 更新文档索引

## 作者

Agent-PDF 项目团队

## 版本

1.0.0 - 初始版本，支持 10 个技术文档的快速查找和打开
