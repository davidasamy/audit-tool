// app/api/process-pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { processPDF } from "@/lib/pdf-processor"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Received PDF: ${fileName || file.name}, size: ${file.size} bytes, type: ${file.type}`)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`Buffer created, processing PDF...`)

    // Process the PDF
    const processed = await processPDF(buffer, fileName || file.name)

    console.log(`Successfully processed PDF: ${processed.chunks.length} chunks created`)

    return NextResponse.json({
      success: true,
      chunks: processed.chunks,
      metadata: processed.metadata,
    })
  } catch (error) {
    console.error("Error processing PDF:", error)
    return NextResponse.json(
      { 
        error: "Failed to process PDF", 
        details: (error as Error).message,
        suggestion: "The PDF might be image-based or scanned. Try using a text-based PDF or use OCR to convert it first."
      },
      { status: 500 }
    )
  }
}