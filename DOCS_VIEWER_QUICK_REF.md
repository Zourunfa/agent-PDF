# 📚 Docs Viewer - 快速参考

## 一键命令

```bash
# 列出所有文档
./docs-viewer list-docs

# 搜索文档
./docs-viewer find-docs <关键词>

# 打开文档
./docs-viewer open-doc <文档名称>

# 查看摘要
./docs-viewer summarize-doc <文档名称>

# 学习路径
./docs-viewer learn <主题>
```

## 🎯 常用主题速查

| 主题 | 命令 | 文档数量 |
|------|------|---------|
| 系统架构 | `./docs-viewer learn architecture` | 4个 |
| 向量数据库 | `./docs-viewer learn vector` | 3个 |
| 数据库 | `./docs-viewer learn database` | 3个 |
| API开发 | `./docs-viewer learn api` | 3个 |
| 编程方法论 | `./docs-viewer learn methodology` | 2个 |
| 问题排查 | `./docs-viewer learn troubleshooting` | 2个 |

## 📂 文档速查表

| 文档名称 | 大小 | 主要内容 |
|---------|------|---------|
| complete-presentation | 93KB | 完整项目讲解 |
| architecture-tutorial | 54KB | 技术架构教程 |
| architecture-diagram | 40KB | 架构图 |
| rag-architecture | 55KB | RAG架构 |
| langchain-vector-tutorial | 46KB | LangChain教程 |
| postgresql-slides | 30KB | PostgreSQL教程 |
| api-documentation | 55KB | API文档 |
| programming-methodology | 125KB | 编程方法论 |
| user-deletion-email-troubleshooting | 35KB | 邮件故障排查 |
| user-deletion-issue-demo | 26KB | 用户删除问题 |

## 🔍 搜索示例

```bash
./docs-viewer find-docs 架构      # 找到4个架构相关文档
./docs-viewer find-docs 向量      # 找到向量数据库教程
./docs-viewer find-docs API       # 找到API文档
./docs-viewer find-docs 数据库    # 找到PostgreSQL教程
./docs-viewer find-docs 问题      # 找到问题排查文档
```

## 🚀 快速开始场景

### 新人入职
```bash
./docs-viewer learn architecture    # 学习架构
./docs-viewer learn vector          # 学习向量数据库
./docs-viewer learn database        # 学习数据库
```

### 功能开发
```bash
./docs-viewer find-docs API         # 查找API文档
./docs-viewer open-doc api-documentation  # 打开API文档
```

### 问题排查
```bash
./docs-viewer find-docs 问题        # 搜索问题文档
./docs-viewer learn troubleshooting  # 查看故障排查指南
```

## 💡 提示

- 所有文档都是**交互式HTML演示文稿**
- 支持**键盘方向键**切换幻灯片
- 使用**方向键**或**点击按钮**导航
- 文档包含**动画效果**，浏览器体验最佳
