import { NextRequest, NextResponse } from "next/server"
import { queryVectorStore, vectorStoreExists } from "@/lib/vector-store"
import { downloadLectureNote } from "@/lib/class-settings-utils"
import { processPDF } from "@/lib/pdf-processor"
import { createOrUpdateVectorStore } from "@/lib/vector-store"

export async function POST(req: NextRequest) {
  try {
    const { classId, assignmentId, lectureFiles } = await req.json()

    if (!classId || !assignmentId) {
      return NextResponse.json(
        { error: "Missing classId or assignmentId" },
        { status: 400 }
      )
    }

    // Check if vector store exists for this class
    const storeExists = await vectorStoreExists(classId)

    // If vector store doesn't exist, create it from lecture notes
    if (!storeExists && lectureFiles && lectureFiles.length > 0) {
      console.log(`Creating vector store for class ${classId}...`)
      
      const allChunks: string[] = []

      for (const filePath of lectureFiles) {
        try {
          console.log(`Processing lecture file: ${filePath}`)
          const blob = await downloadLectureNote(filePath)

          if (blob) {
            const arrayBuffer = await blob.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Process PDF
            const processed = await processPDF(buffer, filePath)
            allChunks.push(...processed.chunks)
            console.log(`Extracted ${processed.chunks.length} chunks from ${filePath}`)
          }
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error)
          // Continue with other files
        }
      }

      if (allChunks.length > 0) {
        // Create vector store with all chunks
        await createOrUpdateVectorStore(classId, allChunks)
        console.log(`Created vector store with ${allChunks.length} chunks`)
      }
    }

    // Query vector store for relevant context
    // We'll use a general query to get the most important lecture content
    const relevantChunks = await queryVectorStore(
      classId,
      "programming algorithms data structures problem solving",
      10, // Get top 10 chunks
      0.1 // Lower threshold to get more general content
    )

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        context: "",
        message: "No lecture notes available or vector store not initialized",
      })
    }

    // Combine chunks into context
    const context = relevantChunks.join("\n\n")

    return NextResponse.json({
      context,
      chunkCount: relevantChunks.length,
    })
  } catch (error) {
    console.error("Error loading lecture context:", error)
    return NextResponse.json(
      {
        error: "Failed to load lecture context",
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}