import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { getPineconeIndex, getEmbeddings } from '@/lib/pinecone/vector-store';
import { ExternalServiceError, NotFoundError } from '@/lib/utils/errors';

/**
 * 向量服务
 * 处理 Pinecone 向量存储和检索操作
 */
export class VectorService {
  /**
   * 将文档添加到向量存储
   */
  async addDocuments(
    documents: Document[],
    namespace: string
  ): Promise<{ vectorCount: number }> {
    try {
      if (!documents || documents.length === 0) {
        return { vectorCount: 0 };
      }

      // 过滤空文档
      const validDocs = documents.filter(
        (doc) => doc.pageContent && doc.pageContent.trim().length > 0
      );

      if (validDocs.length === 0) {
        console.log('[VectorService] All documents are empty, skipping');
        return { vectorCount: 0 };
      }

      // 获取 Pinecone 索引和嵌入模型
      const pineconeIndex = await getPineconeIndex();
      const embeddings = getEmbeddingsModel();

      // 创建向量存储并添加文档
      await PineconeStore.fromDocuments(validDocs, embeddings, {
        pineconeIndex,
        namespace,
      });

      console.log(`[VectorService] Added ${validDocs.length} vectors to namespace: ${namespace}`);

      return { vectorCount: validDocs.length };
    } catch (error) {
      console.error('[VectorService] Error adding documents:', error);
      throw new ExternalServiceError(
        `Failed to add documents to vector store: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Pinecone'
      );
    }
  }

  /**
   * 相似性搜索
   */
  async similaritySearch(
    query: string,
    namespace: string,
    options: {
      k?: number;
      filter?: Record<string, unknown>;
    } = {}
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      const { k = 4, filter } = options;

      if (!query || query.trim().length === 0) {
        return { documents: [], total: 0 };
      }

      // 获取 Pinecone 索引和嵌入模型
      const pineconeIndex = await getPineconeIndex();
      const embeddings = getEmbeddingsModel();

      // 创建向量存储
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace,
      });

      // 执行相似性搜索
      const documents = await vectorStore.similaritySearch(query, k, filter);

      return { documents, total: documents.length };
    } catch (error) {
      console.error('[VectorService] Error during similarity search:', error);
      throw new ExternalServiceError(
        `Failed to search vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Pinecone'
      );
    }
  }

  /**
   * 带分数的相似性搜索
   */
  async similaritySearchWithScore(
    query: string,
    namespace: string,
    options: {
      k?: number;
      filter?: Record<string, unknown>;
    } = {}
  ): Promise<{ results: Array<{ document: Document; score: number }>; total: number }> {
    try {
      const { k = 4, filter } = options;

      if (!query || query.trim().length === 0) {
        return { results: [], total: 0 };
      }

      // 获取 Pinecone 索引和嵌入模型
      const pineconeIndex = await getPineconeIndex();
      const embeddings = getEmbeddingsModel();

      // 创建向量存储
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace,
      });

      // 执行带分数的相似性搜索
      const results = await vectorStore.similaritySearchWithScore(query, k, filter);

      return {
        results: results.map(([document, score]) => ({ document, score })),
        total: results.length,
      };
    } catch (error) {
      console.error('[VectorService] Error during similarity search with score:', error);
      throw new ExternalServiceError(
        `Failed to search vectors with score: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Pinecone'
      );
    }
  }

  /**
   * 删除命名空间中的所有向量
   */
  async deleteByNamespace(namespace: string): Promise<void> {
    try {
      const pineconeIndex = await getPineconeIndex();
      await pineconeIndex.namespace(namespace).deleteAll();
      console.log(`[VectorService] Deleted all vectors in namespace: ${namespace}`);
    } catch (error) {
      console.error('[VectorService] Error deleting namespace:', error);
      throw new ExternalServiceError(
        `Failed to delete namespace: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Pinecone'
      );
    }
  }

  /**
   * 删除特定 PDF 的向量
   */
  async deleteByPDF(pdfId: string, namespace: string): Promise<void> {
    try {
      const pineconeIndex = await getPineconeIndex();
      await pineconeIndex.namespace(namespace).deleteMany({
        filter: { pdfId },
      });
      console.log(`[VectorService] Deleted vectors for PDF: ${pdfId}`);
    } catch (error) {
      console.error('[VectorService] Error deleting PDF vectors:', error);
      // 不抛出错误，因为向量可能不存在
    }
  }

  /**
   * 获取命名空间统计信息
   */
  async getNamespaceStats(namespace: string): Promise<{
    vectorCount: number;
    dimension: number;
  }> {
    try {
      const pineconeIndex = await getPineconeIndex();
      const stats = await pineconeIndex.namespace(namespace).describeIndexStats();

      return {
        vectorCount: stats.totalRecordCount || 0,
        dimension: stats.dimension || 0,
      };
    } catch (error) {
      console.error('[VectorService] Error getting namespace stats:', error);
      return { vectorCount: 0, dimension: 0 };
    }
  }
}

/**
 * 获取嵌入模型
 */
function getEmbeddingsModel() {
  return getEmbeddings();
}
