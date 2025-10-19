import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs/promises";
import path from "path";

// @ts-ignore - pdf-parse doesn't have proper type exports
const pdfParse = require("pdf-parse");

export interface ProcessedDocument {
  chunks: string[];
  metadata: {
    fileName: string;
    totalPages?: number;
    processedAt: string;
  };
}

/**
 * Extract text from a PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  numPages: number;
}> {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      numPages: data.numpages,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Split text into chunks for embedding
 */
async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc: { pageContent: string }) => doc.pageContent);
}

/**
 * Process a PDF file and return chunked text
 */
export async function processPDF(
  pdfBuffer: Buffer,
  fileName: string
): Promise<ProcessedDocument> {
  // Extract text from PDF
  const { text, numPages } = await extractTextFromPDF(pdfBuffer);

  if (!text || text.trim().length === 0) {
    throw new Error("No text content found in PDF");
  }

  // Chunk the text
  const chunks = await chunkText(text);

  return {
    chunks,
    metadata: {
      fileName,
      totalPages: numPages,
      processedAt: new Date().toISOString(),
    },
  };
}

/**
 * Save PDF to assignment directory
 */
export async function savePDF(
  assignmentId: string,
  fileName: string,
  buffer: Buffer
): Promise<string> {
  const pdfDir = path.join(
    process.cwd(),
    "data",
    "assignments",
    assignmentId,
    "pdfs"
  );

  // Ensure directory exists
  await fs.mkdir(pdfDir, { recursive: true });

  const filePath = path.join(pdfDir, fileName);
  await fs.writeFile(filePath, buffer);

  return filePath;
}

/**
 * Get all PDFs for an assignment
 */
export async function getAssignmentPDFs(
  assignmentId: string
): Promise<string[]> {
  const pdfDir = path.join(
    process.cwd(),
    "data",
    "assignments",
    assignmentId,
    "pdfs"
  );

  try {
    const files = await fs.readdir(pdfDir);
    return files.filter((file) => file.endsWith(".pdf"));
  } catch (error) {
    // Directory doesn't exist or is empty
    return [];
  }
}

/**
 * Load a PDF file
 */
export async function loadPDF(
  assignmentId: string,
  fileName: string
): Promise<Buffer> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "assignments",
    assignmentId,
    "pdfs",
    fileName
  );

  return await fs.readFile(filePath);
}
