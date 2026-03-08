/**
 * 测试 Pinecone 上传功能
 */

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local' });

async function testUpload() {
  console.log('🧪 测试 Pinecone 上传功能\n');

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('❌ 未找到 PINECONE_API_KEY');
    process.exit(1);
  }

  const pinecone = new Pinecone({ apiKey });
  const index = pinecone.index('pdf-chat');

  // 测试数据：3个简单的向量
  const testVectors = [
    {
      id: 'test-1',
      values: new Array(1536).fill(0).map(() => Math.random()),
      metadata: {
        pdfId: 'test-pdf',
        content: '这是测试文本1',
        chunkIndex: 0,
      },
    },
    {
      id: 'test-2',
      values: new Array(1536).fill(0).map(() => Math.random()),
      metadata: {
        pdfId: 'test-pdf',
        content: '这是测试文本2',
        chunkIndex: 1,
      },
    },
    {
      id: 'test-3',
      values: new Array(1536).fill(0).map(() => Math.random()),
      metadata: {
        pdfId: 'test-pdf',
        content: '这是测试文本3',
        chunkIndex: 2,
      },
    },
  ];

  try {
    console.log(`📤 上传 ${testVectors.length} 个测试向量...`);
    
    // Pinecone SDK v7+ 需要 records 包装
    await index.upsert({ records: testVectors });
    console.log('✅ 上传成功！\n');

    // 等待索引更新
    console.log('⏳ 等待索引更新（5秒）...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 查询测试
    console.log('🔍 测试查询...');
    const queryVector = new Array(1536).fill(0).map(() => Math.random());
    const results = await index.query({
      vector: queryVector,
      topK: 3,
      filter: { pdfId: { $eq: 'test-pdf' } },
      includeMetadata: true,
    });

    console.log(`✅ 找到 ${results.matches.length} 个结果\n`);
    results.matches.forEach((match, i) => {
      console.log(`结果 ${i + 1}:`);
      console.log(`  ID: ${match.id}`);
      console.log(`  分数: ${match.score?.toFixed(4)}`);
      console.log(`  内容: ${match.metadata?.content}`);
      console.log('');
    });

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    await index.deleteMany({ filter: { pdfId: { $eq: 'test-pdf' } } });
    console.log('✅ 清理完成\n');

    console.log('🎉 所有测试通过！Pinecone 工作正常');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('完整错误:', error);
    process.exit(1);
  }
}

testUpload();
