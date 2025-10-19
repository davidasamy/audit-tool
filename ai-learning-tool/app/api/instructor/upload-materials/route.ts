import { NextRequest, NextResponse } from "next/server";
import { processPDF, savePDF } from "@/lib/pdf-processor";
import { createOrUpdateVectorStore } from "@/lib/vector-store";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const assignmentId = formData.get("assignmentId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process PDF to extract and chunk text
    const processedDoc = await processPDF(buffer, file.name);

    if (processedDoc.chunks.length === 0) {
      return NextResponse.json(
        { error: "No text content found in PDF" },
        { status: 400 }
      );
    }

    // Save PDF to assignment directory
    await savePDF(assignmentId, file.name, buffer);

    // Create or update vector store with new chunks
    await createOrUpdateVectorStore(assignmentId, processedDoc.chunks);

    return NextResponse.json({
      success: true,
      message: "PDF uploaded and processed successfully",
      fileName: file.name,
      chunks: processedDoc.chunks.length,
      metadata: processedDoc.metadata,
    });
  } catch (error) {
    console.error("Upload error:", error);
    
    // Return specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("No text content found")) {
        return NextResponse.json(
          { error: "The PDF appears to be empty or contains no readable text" },
          { status: 400 }
        );
      }
      if (error.message.includes("Failed to extract text")) {
        return NextResponse.json(
          { error: "Failed to process PDF. The file may be corrupted or password-protected" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to upload and process PDF" },
      { status: 500 }
    );
  }
}

// GET endpoint to list uploaded PDFs for an assignment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const { getAssignmentPDFs } = await import("@/lib/pdf-processor");
    const { vectorStoreExists } = await import("@/lib/vector-store");

    // Get list of PDFs
    const pdfFiles = await getAssignmentPDFs(assignmentId);
    
    // Check if vector store exists
    const hasVectorStore = await vectorStoreExists(assignmentId);

    return NextResponse.json({
      assignmentId,
      pdfFiles,
      hasVectorStore,
      totalFiles: pdfFiles.length,
    });
  } catch (error) {
    console.error("Error fetching assignment materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment materials" },
      { status: 500 }
    );
  }
}
