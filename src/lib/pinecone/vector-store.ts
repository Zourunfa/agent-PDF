/**
 * Pinecone Vector Store Operations
 *
 * 使用 Pinecone 存储和检索向量数据
 * 优势：
 * - 完全托管，无需维护
 * - 持久化存储，跨实例共享
 * - 高性能相似度搜索
 * - 免费版足够个人项目使用
 */

import { Document } from '@langchain/core/documents';
import { getPineconeIndex, isPineconeConfigured } from './config';
import { getEmbeddings } from '@/lib/langchain/config';

/**
 * 存储文档向量到 Pinecone
 * @param pdfId PDF ID
 * @param documents 文档列表
 * @param userId 用户ID（用于命名空间隔离）
 */
export async function storePineconeVectors(
  pdfId: string,
  documents: Document[],
  userId?: string
): Promise<void> {
  if (!isPineconeConfigured) {
    console.log('[Pinecone] Not configured, skipping vector storage');
    return;
  }

  // 检查是否有文档
  if (!documents || documents.length === 0) {
    console.log('[Pinecone] No documents to store, skipping');
    return;
  }

  try {
    console.log(`[Pinecone] Storing ${documents.length} vectors for PDF: ${pdfId}`);
    const startTime = Date.now();

    // 1. 生成向量嵌入
    const embeddingModel = getEmbeddings();
    const texts = documents.map((doc) => doc.pageContent);

    // 过滤空文本
    const validTexts = texts.filter((t) => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      console.log('[Pinecone] All texts are empty, skipping');
      return;
    }

    if (validTexts.length < texts.length) {
      console.log(`[Pinecone] Filtered ${texts.length - validTexts.length} empty texts`);
    }

    const embeddings = await embeddingModel.embedDocuments(validTexts);
    console.log(`[Pinecone] ✓ Generated ${embeddings.length} embeddings`);

    // 2. 准备 Pinecone 数据格式
    const index = getPineconeIndex();
    const vectors = embeddings.map((embedding, i) => {
      // 找到对应的非空文档
      let docIndex = 0;
      let validCount = 0;
      for (let j = 0; j < documents.length; j++) {
        if (documents[j].pageContent && documents[j].pageContent.trim().length > 0) {
          if (validCount === i) {
            docIndex = j;
            break;
          }
          validCount++;
        }
      }

      // 处理 metadata：只保留 Pinecone 支持的类型（string, number, boolean, string[]）
      // 将嵌套对象转换为 JSON 字符串
      const cleanMetadata: Record<string, string | number | boolean | string[]> = {
        pdfId,
        chunkIndex: docIndex,
      };

      if (userId) {
        cleanMetadata.userId = userId;
      }

      // 添加文本内容（截断到 Pinecone 限制）
      cleanMetadata.content = documents[docIndex].pageContent.slice(0, 40000);

      // 处理其他 metadata 字段
      const docMetadata = documents[docIndex].metadata || {};
      for (const [key, value] of Object.entries(docMetadata)) {
        if (value === null || value === undefined) {
          continue;
        }

        // Pinecone 支持的类型
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          cleanMetadata[key] = value;
        } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
          cleanMetadata[key] = value;
        } else {
          // 将复杂对象转换为 JSON 字符串
          cleanMetadata[key] = JSON.stringify(value);
        }
      }

      return {
        id: `${pdfId}-chunk-${docIndex}`,
        values: embedding,
        metadata: cleanMetadata,
      };
    });

    // 3. 批量上传到 Pinecone（每次最多 100 个）
    if (vectors.length === 0) {
      console.log('[Pinecone] No vectors to upload');
      return;
    }

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      // Pinecone SDK v7+ 需要 records 包装
      // 使用 namespace 隔离用户数据
      await index.upsert({
        records: batch,
        namespace: userId || 'default',
      });
      console.log(
        `[Pinecone] ✓ Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)} (namespace: ${userId || 'default'})`
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[Pinecone] ✓ Successfully stored ${vectors.length} vectors in ${duration}ms`);
  } catch (error) {
    console.error(`[Pinecone] ✗ Failed to store vectors:`, error);
    throw error;
  }
}

/**
 * 从 Pinecone 搜索相似文档
 * @param pdfId PDF ID
 * @param query 查询文本
 * @param topK 返回结果数量
 * @param userId 用户ID（用于命名空间隔离）
 */
export async function searchPineconeVectors(
  pdfId: string,
  query: string,
  topK: number = 4,
  userId?: string
): Promise<Document[]> {
  if (!isPineconeConfigured) {
    console.log('[Pinecone] Not configured, returning empty results');
    return [];
  }

  try {
    console.log(`[Pinecone] Searching for "${query}" in PDF: ${pdfId} (topK=${topK})`);
    const startTime = Date.now();

    // 1. 生成查询向量
    const embeddingModel = getEmbeddings();
    const queryEmbedding = await embeddingModel.embedQuery(query);
    console.log(`[Pinecone] ✓ Generated query embedding`);

    // 2. 在 Pinecone 中搜索
    const index = getPineconeIndex();

    // 构建过滤条件
    const filterConditions: any = { pdfId: { $eq: pdfId } };
    if (userId) {
      filterConditions.userId = { $eq: userId };
    }

    const results = await index.query({
      vector: queryEmbedding,
      topK,
      filter: filterConditions,
      namespace: userId || 'default',
      includeMetadata: true,
    });

    const duration = Date.now() - startTime;
    console.log(`[Pinecone] ✓ Found ${results.matches.length} results in ${duration}ms`);

    // 3. 转换为 LangChain Document 格式
    const documents = results.matches
      .filter((match) => match.metadata && match.metadata.content)
      .map((match) => {
        const { content, pdfId: metaPdfId, chunkIndex, ...otherMetadata } = match.metadata as any;
        return new Document({
          pageContent: content,
          metadata: {
            pdfId: metaPdfId,
            chunkIndex,
            score: match.score,
            ...otherMetadata,
          },
        });
      });

    // 4. 过滤低分结果（Pinecone 使用余弦相似度，分数越高越相似）
    const threshold = 0.7; // 余弦相似度阈值
    const filteredDocs = documents.filter((doc) => (doc.metadata.score as number) >= threshold);

    if (filteredDocs.length < documents.length) {
      console.log(
        `[Pinecone] Filtered ${documents.length - filteredDocs.length} low-score results (threshold: ${threshold})`
      );
    }

    // 如果所有结果都被过滤，返回前2个最佳结果
    if (filteredDocs.length === 0 && documents.length > 0) {
      console.log(
        `[Pinecone] All results filtered, returning top ${Math.min(2, documents.length)} anyway`
      );
      return documents.slice(0, Math.min(2, documents.length));
    }

    // 记录结果详情
    filteredDocs.forEach((doc, idx) => {
      console.log(
        `[Pinecone] Result ${idx + 1}: score=${(doc.metadata.score as number).toFixed(4)}, preview="${doc.pageContent.substring(0, 50)}..."`
      );
    });

    return filteredDocs;
  } catch (error) {
    console.error(`[Pinecone] ✗ Search failed:`, error);
    return [];
  }
}

/**
 * 删除 PDF 的所有向量
 */
export async function deletePineconeVectors(pdfId: string): Promise<void> {
  if (!isPineconeConfigured) {
    console.log('[Pinecone] Not configured, skipping deletion');
    return;
  }

  try {
    console.log(`[Pinecone] Deleting vectors for PDF: ${pdfId}`);
    const index = getPineconeIndex();

    // Pinecone SDK v7+ 需要 filter 包装
    await index.deleteMany({ filter: { pdfId: { $eq: pdfId } } });

    console.log(`[Pinecone] ✓ Deleted all vectors for PDF: ${pdfId}`);
  } catch (error) {
    console.error(`[Pinecone] ✗ Failed to delete vectors:`, error);
    throw error;
  }
}

/**
 * 检查 PDF 是否已有向量数据
 * @param pdfId PDF ID
 * @param userId 用户ID（用于命名空间隔离）
 */
export async function hasPineconeVectors(pdfId: string, userId?: string): Promise<boolean> {
  if (!isPineconeConfigured) {
    return false;
  }

  try {
    const index = getPineconeIndex();

    // 构建过滤条件
    const filterConditions: any = { pdfId: { $eq: pdfId } };
    if (userId) {
      filterConditions.userId = { $eq: userId };
    }

    // 查询一个向量来检查是否存在
    const results = await index.query({
      vector: new Array(1536).fill(0), // 使用零向量
      topK: 1,
      filter: filterConditions,
      namespace: userId || 'default',
      includeMetadata: false,
    });

    const exists = results.matches.length > 0;
    console.log(
      `[Pinecone] PDF ${pdfId} vectors exist: ${exists} (namespace: ${userId || 'default'})`
    );
    return exists;
  } catch (error) {
    console.error(`[Pinecone] ✗ Failed to check vectors:`, error);
    return false;
  }
}
