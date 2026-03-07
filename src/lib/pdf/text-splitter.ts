/**
 * Text splitting utilities for chunking PDF content
 */

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
  separators: string[];
}

/**
 * Default chunk configuration
 */
export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""],
};

/**
 * Create text splitter instance
 */
export function createTextSplitter(config?: Partial<ChunkConfig>): RecursiveCharacterTextSplitter {
  const finalConfig = { ...DEFAULT_CHUNK_CONFIG, ...config };

  return new RecursiveCharacterTextSplitter({
    chunkSize: finalConfig.chunkSize,
    chunkOverlap: finalConfig.chunkOverlap,
    separators: finalConfig.separators,
  });
}

/**
 * Split text into chunks
 */
export async function splitTextIntoChunks(
  text: string,
  config?: Partial<ChunkConfig>
): Promise<string[]> {
  const splitter = createTextSplitter(config);
  const documents = await splitter.createDocuments([text]);
  return documents.map((doc) => doc.pageContent);
}

/**
 * Split text with metadata
 */
export async function splitTextWithMetadata(
  text: string,
  metadata: Record<string, unknown>,
  config?: Partial<ChunkConfig>
): Promise<Array<{ content: string; metadata: Record<string, unknown> }>> {
  const splitter = createTextSplitter(config);
  const documents = await splitter.createDocuments([text], [metadata]);

  return documents.map((doc) => ({
    content: doc.pageContent,
    metadata: { ...doc.metadata, ...metadata },
  }));
}
