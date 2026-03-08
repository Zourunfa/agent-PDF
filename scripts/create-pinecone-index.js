/**
 * Pinecone 索引创建脚本
 * 
 * 使用方法：
 * 1. 确保 .env.local 中有 PINECONE_API_KEY
 * 2. 运行: node scripts/create-pinecone-index.js
 */

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local' });

async function createIndex() {
  console.log('🚀 开始创建 Pinecone 索引...\n');

  // 检查 API Key
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('❌ 错误: 未找到 PINECONE_API_KEY');
    console.error('请在 .env.local 文件中设置 PINECONE_API_KEY');
    process.exit(1);
  }

  console.log('✓ API Key 已配置');
  console.log(`✓ API Key 前缀: ${apiKey.substring(0, 10)}...`);

  // 初始化 Pinecone 客户端
  const pinecone = new Pinecone({
    apiKey: apiKey
  });

  console.log('✓ Pinecone 客户端已初始化\n');

  // 索引配置
  const indexName = 'pdf-chat';
  const indexConfig = {
    name: indexName,
    dimension: 1536,  // Alibaba Tongyi Embeddings 维度
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1'
      }
    }
  };

  console.log('📋 索引配置:');
  console.log(`   名称: ${indexConfig.name}`);
  console.log(`   维度: ${indexConfig.dimension}`);
  console.log(`   度量: ${indexConfig.metric}`);
  console.log(`   云服务: ${indexConfig.spec.serverless.cloud}`);
  console.log(`   区域: ${indexConfig.spec.serverless.region}\n`);

  try {
    // 检查索引是否已存在
    console.log('🔍 检查索引是否已存在...');
    const indexes = await pinecone.listIndexes();
    const existingIndex = indexes.indexes?.find(idx => idx.name === indexName);

    if (existingIndex) {
      console.log(`⚠️  索引 "${indexName}" 已存在`);
      console.log('索引信息:', JSON.stringify(existingIndex, null, 2));
      
      // 检查维度是否正确
      if (existingIndex.dimension !== 1536) {
        console.error(`\n❌ 错误: 现有索引维度为 ${existingIndex.dimension}，需要 1536`);
        console.error('建议: 删除现有索引并重新创建');
        console.error(`\n删除命令: 在 Pinecone 控制台删除索引 "${indexName}"`);
        process.exit(1);
      } else {
        console.log('\n✅ 索引配置正确，可以直接使用！');
        process.exit(0);
      }
    }

    // 创建索引
    console.log(`📦 正在创建索引 "${indexName}"...`);
    await pinecone.createIndex(indexConfig);
    
    console.log('\n✅ 索引创建成功！');
    console.log('\n⏳ 等待索引初始化（通常需要 1-2 分钟）...');
    
    // 等待索引就绪
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒
      attempts++;
      
      try {
        const indexDescription = await pinecone.describeIndex(indexName);
        if (indexDescription.status?.ready) {
          console.log('\n✅ 索引已就绪！');
          console.log('\n索引详情:');
          console.log(JSON.stringify(indexDescription, null, 2));
          console.log('\n🎉 完成！现在可以使用 Pinecone 了');
          console.log('\n下一步:');
          console.log('1. 确保 .env.local 中有以下配置:');
          console.log('   PINECONE_API_KEY=your-api-key');
          console.log('   PINECONE_INDEX_NAME=pdf-chat');
          console.log('2. 启动应用: npm run dev');
          console.log('3. 上传 PDF 测试');
          return;
        }
        
        console.log(`⏳ 索引初始化中... (${attempts}/${maxAttempts})`);
      } catch (error) {
        console.log(`⏳ 等待索引创建... (${attempts}/${maxAttempts})`);
      }
    }
    
    console.log('\n⚠️  索引创建超时，但可能仍在初始化中');
    console.log('请在 Pinecone 控制台检查索引状态');
    
  } catch (error) {
    console.error('\n❌ 创建索引失败:');
    console.error('错误信息:', error.message);
    
    if (error.message.includes('already exists')) {
      console.error('\n索引已存在，请在 Pinecone 控制台检查');
    } else if (error.message.includes('authentication') || error.message.includes('401')) {
      console.error('\nAPI Key 无效，请检查 PINECONE_API_KEY');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.error('\n已达到免费版限制，请升级或删除现有索引');
    } else {
      console.error('\n完整错误:', error);
    }
    
    process.exit(1);
  }
}

// 运行脚本
createIndex().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
