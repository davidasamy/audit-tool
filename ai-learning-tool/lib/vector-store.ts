import fs from "fs/promises";
import path from "path";

/**
 * Simple in-memory vector store for MVP
 * For production, consider using proper FAISS or other vector databases
 */
interface VectorDocument {
  content: string;
  embedding: number[];
  metadata: any;
}

interface VectorStoreData {
  documents: VectorDocument[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Get the vector store directory path for an assignment
 */
function getVectorStorePath(assignmentId: string): string {
  return path.join(
    process.cwd(),
    "data",
    "assignments",
    assignmentId,
    "vectors"
  );
}

/**
 * Get vector store file path
 */
function getVectorStoreFile(assignmentId: string): string {
  return path.join(getVectorStorePath(assignmentId), "vectors.json");
}

/**
 * Load vector store data from file
 */
async function loadVectorStore(assignmentId: string): Promise<VectorStoreData | null> {
  try {
    const filePath = getVectorStoreFile(assignmentId);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as VectorStoreData;
  } catch {
    return null;
  }
}

/**
 * Save vector store data to file
 */
async function saveVectorStore(assignmentId: string, data: VectorStoreData): Promise<void> {
  const vectorStorePath = getVectorStorePath(assignmentId);
  await fs.mkdir(vectorStorePath, { recursive: true });
  
  const filePath = getVectorStoreFile(assignmentId);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Create or update vector store for an assignment
 */
export async function createOrUpdateVectorStore(
  assignmentId: string,
  textChunks: string[]
): Promise<void> {
  const { generateEmbedding } = await import("./bedrock");
  
  // Load existing store or create new one
  let storeData = await loadVectorStore(assignmentId);
  if (!storeData) {
    storeData = {
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Generate embeddings for new chunks
  for (const chunk of textChunks) {
    try {
      const embedding = await generateEmbedding(chunk);
      storeData.documents.push({
        content: chunk,
        embedding,
        metadata: {},
      });
    } catch (error) {
      console.error("Error generating embedding for chunk:", error);
      // Skip this chunk but continue with others
    }
  }

  storeData.updatedAt = new Date().toISOString();
  await saveVectorStore(assignmentId, storeData);
}

/**
 * Query the vector store to retrieve relevant context
 */
export async function queryVectorStore(
  assignmentId: string,
  query: string,
  topK: number = 5
): Promise<string[]> {
  try {
    const { generateEmbedding } = await import("./bedrock");
    const storeData = await loadVectorStore(assignmentId);

    if (!storeData || storeData.documents.length === 0) {
      return [];
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Calculate similarities and sort
    const results = storeData.documents
      .map((doc) => ({
        content: doc.content,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results.map((result) => result.content);
  } catch (error) {
    console.warn(
      `Error querying vector store for assignment ${assignmentId}:`,
      error
    );
    return [];
  }
}

/**
 * Check if vector store exists for an assignment
 */
export async function vectorStoreExists(
  assignmentId: string
): Promise<boolean> {
  try {
    const filePath = getVectorStoreFile(assignmentId);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete vector store for an assignment
 */
export async function deleteVectorStore(assignmentId: string): Promise<void> {
  const vectorStorePath = getVectorStorePath(assignmentId);

  try {
    await fs.rm(vectorStorePath, { recursive: true, force: true });
  } catch (error) {
    console.error("Error deleting vector store:", error);
  }
}
