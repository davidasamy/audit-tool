import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs/promises";
import path from "path";

export interface ProcessedDocument {
  chunks: string[]
  metadata: {
    fileName: string
    totalPages?: number
    processedAt: string
  }
}

/**
 * Extract text from a PDF buffer using pdf2json
 */
async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string
  numPages: number
}> {
  try {
    // Use require for CommonJS module and instantiate PDFParse class
    // @ts-ignore - pdf-parse is a CommonJS module
    const { PDFParse } = require("pdf-parse");
    const parser = new PDFParse();
    const data = await parser.parse(buffer);
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
    chunkSize: 1200,
    chunkOverlap: 100,
    separators: ["\n\n", "\n", ". ", " ", ""],
  })

  const docs = await splitter.createDocuments([text])

  // Filter out chunks that are too short
  const minChunkLength = 50 // Reduced from 100 to be more lenient
  const filteredChunks = docs
    .map((doc: { pageContent: string }) => doc.pageContent.trim())
    .filter((chunk) => chunk.length >= minChunkLength)

  console.log(
    `Created ${docs.length} chunks, kept ${filteredChunks.length} after filtering (min length: ${minChunkLength})`
  )

  return filteredChunks
}

/**
 * Process a PDF file and return chunked text
 */
export async function processPDF(
  pdfBuffer: Buffer,
  fileName: string
): Promise<ProcessedDocument> {
  console.log(`Processing PDF: ${fileName}, size: ${pdfBuffer.length} bytes`)
  
  // Extract text from PDF
  const { text, numPages } = await extractTextFromPDF(pdfBuffer)

  if (!text || text.trim().length === 0) {
    console.error("No text extracted from PDF. This might be an image-based PDF or have extraction issues.")
    throw new Error("No text content found in PDF. The PDF might be image-based or require OCR.")
  }

  console.log(`Successfully extracted ${text.length} characters from ${numPages} pages`)

  // Chunk the text
  const chunks = await chunkText(text)

  if (chunks.length === 0) {
    console.warn("No chunks created after filtering. Text might be too short or fragmented.")
    // Return at least one chunk with all the text
    return {
      chunks: [text],
      metadata: {
        fileName,
        totalPages: numPages,
        processedAt: new Date().toISOString(),
      },
    }
  }

  return {
    chunks,
    metadata: {
      fileName,
      totalPages: numPages,
      processedAt: new Date().toISOString(),
    },
  }
}