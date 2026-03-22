#!/usr/bin/env node

/**
 * Docs Viewer - 项目技术文档快速查看器
 *
 * 功能：
 * - 列出所有技术文档
 * - 根据关键词搜索文档
 * - 在浏览器中打开文档
 * - 显示文档摘要
 * - 推荐学习路径
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.join(process.cwd(), 'docs');

// 文档分类
const CATEGORIES = {
  architecture: {
    name: '🏗️ 架构与设计',
    files: ['complete-presentation', 'architecture-tutorial', 'architecture-diagram', 'rag-architecture']
  },
  tech: {
    name: '💻 技术栈与实现',
    files: ['langchain-vector-tutorial', 'postgresql-slides', 'api-documentation']
  },
  methodology: {
    name: '🎯 方法论与最佳实践',
    files: ['programming-methodology']
  },
  troubleshooting: {
    name: '🐛 问题排查',
    files: ['user-deletion-email-troubleshooting', 'user-deletion-issue-demo']
  }
};

// 文档元信息
const DOC_METADATA = {
  'complete-presentation': {
    title: 'Agent-PDF 完整讲解文稿',
    size: '93KB',
    topics: ['架构', '方法论', '技术栈', '最佳实践']
  },
  'architecture-tutorial': {
    title: 'PDF AI 聊天应用技术架构教程',
    size: '54KB',
    topics: ['Next.js', 'LangChain', 'Redis', '架构设计']
  },
  'architecture-diagram': {
    title: 'Agent-PDF 技术架构图',
    size: '40KB',
    topics: ['系统架构', '流程图', '技术栈']
  },
  'rag-architecture': {
    title: 'RAG 架构原理图',
    size: '55KB',
    topics: ['RAG', '向量检索', 'AI 架构']
  },
  'langchain-vector-tutorial': {
    title: 'LangChain 与向量数据库实战教程',
    size: '46KB',
    topics: ['LangChain', '向量数据库', 'AI', '嵌入']
  },
  'postgresql-slides': {
    title: 'PostgreSQL 数据库教程',
    size: '30KB',
    topics: ['PostgreSQL', '数据库', 'SQL', '表结构']
  },
  'api-documentation': {
    title: 'PDF AI Chat API 接口文档',
    size: '55KB',
    topics: ['API', 'REST', '接口文档', '认证']
  },
  'programming-methodology': {
    title: '编程方法论对比：Vibe Coding vs Spec Coding',
    size: '125KB',
    topics: ['编程方法论', 'Vibe Coding', 'Spec Coding', '最佳实践']
  },
  'user-deletion-email-troubleshooting': {
    title: '用户删除和邮件发送故障排查演示',
    size: '35KB',
    topics: ['问题排查', '邮件', '用户管理', '故障']
  },
  'user-deletion-issue-demo': {
    title: '用户删除功能问题分析与解决方案演示',
    size: '26KB',
    topics: ['问题分析', '用户删除', '解决方案']
  }
};

/**
 * 获取所有文档文件
 */
function getAllDocs() {
  const files = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));
  return files;
}

/**
 * 列出所有文档
 */
function listDocs() {
  console.log('\n📚 Agent-PDF 技术文档列表\n');

  for (const [key, category] of Object.entries(CATEGORIES)) {
    console.log(`${category.name}:`);
    category.files.forEach(docName => {
      const meta = DOC_METADATA[docName];
      if (meta) {
        console.log(`  • ${docName} (${meta.size}) - ${meta.title}`);
      }
    });
    console.log('');
  }

  console.log(`\n💡 使用命令打开文档: open-doc <文档名称>`);
  console.log(`💡 使用关键词搜索: find-docs <关键词>\n`);
}

/**
 * 搜索文档
 */
function findDocs(keyword) {
  const results = [];

  for (const [docName, meta] of Object.entries(DOC_METADATA)) {
    const searchText = `${meta.title} ${meta.topics.join(' ')}`.toLowerCase();
    if (searchText.includes(keyword.toLowerCase())) {
      results.push({ name: docName, ...meta });
    }
  }

  if (results.length === 0) {
    console.log(`\n❌ 未找到与 "${keyword}" 相关的文档`);
    console.log(`💡 使用 /list-docs 查看所有可用文档\n`);
  } else {
    console.log(`\n🔍 找到 ${results.length} 个与 "${keyword}" 相关的文档:\n`);
    results.forEach(doc => {
      console.log(`  • ${doc.name} (${doc.size})`);
      console.log(`    ${doc.title}`);
      console.log(`    主题: ${doc.topics.join(', ')}`);
      console.log('');
    });
  }

  return results;
}

/**
 * 在浏览器中打开文档
 */
function openDoc(docName) {
  const filePath = path.join(DOCS_DIR, `${docName}.html`);

  if (!fs.existsSync(filePath)) {
    console.log(`\n❌ 文档不存在: ${docName}`);
    console.log(`💡 使用 /list-docs 查看所有可用文档\n`);
    return false;
  }

  try {
    execSync(`open "${filePath}"`, { stdio: 'ignore' });
    console.log(`\n✅ 已在浏览器中打开: ${DOC_METADATA[docName]?.title || docName}\n`);
    return true;
  } catch (error) {
    console.log(`\n❌ 无法打开文档: ${error.message}\n`);
    return false;
  }
}

/**
 * 显示文档摘要
 */
function summarizeDoc(docName) {
  const meta = DOC_METADATA[docName];

  if (!meta) {
    console.log(`\n❌ 未找到文档: ${docName}\n`);
    return;
  }

  console.log(`\n📄 ${meta.title}`);
  console.log(`文件大小: ${meta.size}`);
  console.log(`主题标签: ${meta.topics.join(', ')}`);
  console.log(`\n💡 使用 open-doc ${docName} 在浏览器中打开完整文档\n`);
}

/**
 * 推荐学习路径
 */
function recommendLearning(topic) {
  const topicMap = {
    'architecture': ['complete-presentation', 'architecture-tutorial', 'architecture-diagram', 'rag-architecture'],
    'vector': ['langchain-vector-tutorial', 'rag-architecture', 'complete-presentation'],
    'rag': ['rag-architecture', 'langchain-vector-tutorial', 'architecture-tutorial'],
    'database': ['postgresql-slides', 'architecture-tutorial', 'complete-presentation'],
    'api': ['api-documentation', 'architecture-tutorial', 'complete-presentation'],
    'methodology': ['programming-methodology', 'complete-presentation'],
    'troubleshooting': ['user-deletion-email-troubleshooting', 'user-deletion-issue-demo']
  };

  const docs = topicMap[topic.toLowerCase()];

  if (!docs) {
    console.log(`\n❌ 未找到主题 "${topic}" 的学习路径`);
    console.log(`\n可用主题:`);
    console.log(`  • architecture - 系统架构`);
    console.log(`  • vector - 向量数据库`);
    console.log(`  • rag - RAG 架构`);
    console.log(`  • database - 数据库`);
    console.log(`  • api - API 开发`);
    console.log(`  • methodology - 编程方法论`);
    console.log(`  • troubleshooting - 问题排查\n`);
    return;
  }

  console.log(`\n📚 "${topic}" 学习路径:\n`);
  docs.forEach((docName, index) => {
    const meta = DOC_METADATA[docName];
    console.log(`${index + 1}. ${docName}`);
    console.log(`   ${meta?.title || docName}`);
    console.log(`   ${meta?.size || ''}\n`);
  });

  console.log(`💡 使用 open-doc <文档名称> 开始学习\n`);
}

// CLI 命令处理
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
  case 'list-docs':
    listDocs();
    break;

  case 'find':
  case 'find-docs':
    if (!arg) {
      console.log('\n❌ 请提供搜索关键词');
      console.log('用法: node docs-viewer.js find-docs <关键词>\n');
    } else {
      findDocs(arg);
    }
    break;

  case 'open':
  case 'open-doc':
    if (!arg) {
      console.log('\n❌ 请提供文档名称');
      console.log('用法: node docs-viewer.js open-doc <文档名称>\n');
    } else {
      openDoc(arg);
    }
    break;

  case 'summarize':
  case 'summarize-doc':
    if (!arg) {
      console.log('\n❌ 请提供文档名称');
      console.log('用法: node docs-viewer.js summarize-doc <文档名称>\n');
    } else {
      summarizeDoc(arg);
    }
    break;

  case 'learn':
    if (!arg) {
      console.log('\n❌ 请提供学习主题');
      console.log('用法: node docs-viewer.js learn <主题>\n');
    } else {
      recommendLearning(arg);
    }
    break;

  default:
    console.log('\n📚 Docs Viewer - 项目技术文档快速查看器\n');
    console.log('用法:');
    console.log('  node docs-viewer.js list-docs          - 列出所有文档');
    console.log('  node docs-viewer.js find-docs <关键词>  - 搜索文档');
    console.log('  node docs-viewer.js open-doc <文档名称>  - 打开文档');
    console.log('  node docs-viewer.js summarize-doc <文档名称>  - 显示文档摘要');
    console.log('  node docs-viewer.js learn <主题>        - 推荐学习路径\n');
    console.log('示例:');
    console.log('  node docs-viewer.js find-docs 架构');
    console.log('  node docs-viewer.js open-doc architecture-tutorial');
    console.log('  node docs-viewer.js learn architecture\n');
    break;
}
