/**
 * Embeddings Service for Rules Explorer
 * Generates vector embeddings using OpenAI for semantic search
 *
 * Tasks: T007, T008
 */

import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 100;

let openaiClient: OpenAI | null = null;

/**
 * Check if embedding generation is available (OPENAI_API_KEY is set)
 */
export function isEmbeddingAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get or create OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required for embeddings');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate embedding for a single text
 * @param text - The text to generate embedding for
 * @returns The embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  // Truncate text if too long (max ~8000 tokens for this model)
  const truncatedText = text.slice(0, 30000);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedText,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts with batching and rate limiting
 * @param texts - Array of texts to generate embeddings for
 * @param onProgress - Optional callback for progress updates
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(
  texts: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<number[][]> {
  const client = getOpenAIClient();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    // Truncate each text in the batch
    const truncatedBatch = batch.map(text => text.slice(0, 30000));

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncatedBatch,
    });

    // Extract embeddings in order
    const batchEmbeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map(d => d.embedding);

    results.push(...batchEmbeddings);

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, texts.length), texts.length);
    }

    // Rate limiting: wait between batches (except for the last one)
    if (i + BATCH_SIZE < texts.length) {
      await delay(RATE_LIMIT_DELAY_MS);
    }
  }

  return results;
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score between 0 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embedding vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Format embedding vector for PostgreSQL pgvector
 * @param embedding - The embedding vector
 * @returns String formatted for pgvector (e.g., "[0.1,0.2,0.3]")
 */
export function formatEmbeddingForPgvector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Parse embedding vector from PostgreSQL pgvector format
 * @param pgvectorString - The pgvector formatted string
 * @returns The embedding vector
 */
export function parseEmbeddingFromPgvector(pgvectorString: string): number[] {
  // Remove brackets and split by comma
  const cleaned = pgvectorString.replace(/[\[\]]/g, '');
  return cleaned.split(',').map(Number);
}

/**
 * Get embedding dimensions
 */
export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}

/**
 * Get batch size for embedding generation
 */
export function getBatchSize(): number {
  return BATCH_SIZE;
}

/**
 * Helper function for delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const embeddingsService = {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  formatEmbeddingForPgvector,
  parseEmbeddingFromPgvector,
  getEmbeddingDimensions,
  getBatchSize,
};

export default embeddingsService;
