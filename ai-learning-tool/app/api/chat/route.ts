import { NextRequest } from "next/server";
import { streamBedrockResponse } from "@/lib/bedrock";
import { queryVectorStore, vectorStoreExists } from "@/lib/vector-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received chat request:", JSON.stringify(body, null, 2));
    
    // Handle both new format and @ai-sdk format
    const messages = body.messages || [];
    const problemContext = body.problemContext;
    
    // If no problemContext provided, use default for twosum
    const context = problemContext || { 
      id: "twosum", 
      title: "Two Sum", 
      description: "Find two numbers in an array that sum to a target value" 
    };

    let userQuery = "";
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Extract text from the nested parts structure
      if (lastMessage.parts && lastMessage.parts.length > 0) {
        const textPart = lastMessage.parts.find((part: any) => part.type === "text");
        userQuery = textPart?.text || "";
      } else {
        userQuery = lastMessage.text || lastMessage.content || "";
      }
    }

    if (!userQuery) {
      console.log("No user query found, sending error response");
      // Don't use a default query, instead return an error
      throw new Error("No user message found");
    }
    
    console.log("Processing query:", userQuery);
    console.log("Problem context:", context);

    const assignmentId = context.id;
    let contextChunks: string[] = [];

    // Check if vector store exists for this assignment
    if (await vectorStoreExists(assignmentId)) {
      try {
        // Retrieve relevant context from RAG
        contextChunks = await queryVectorStore(assignmentId, userQuery, 5);
        console.log(`Found ${contextChunks.length} relevant context chunks for query: "${userQuery}"`);
      } catch (error) {
        console.error("Error querying vector store:", error);
        // Continue without RAG context if there's an error
      }
    } else {
      console.log(`No vector store found for assignment ${assignmentId}`);
    }

    // Build system prompt with RAG context and restrictions
    const systemPrompt = buildSystemPrompt(context, contextChunks);

    // Create a ReadableStream to stream the response
    const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    // helper to send one SSE line
    const send = (obj: unknown) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
    };

    try {
      const messageId = crypto.randomUUID();
      const textBlockId = crypto.randomUUID();

      // 1) message start
      send({ type: "start", messageId });

      // 2) text-start
      send({ type: "text-start", id: textBlockId });

      // 3) stream deltas
      for await (const chunk of streamBedrockResponse({
        prompt: userQuery,
        systemPrompt,
        maxTokens: 1024,
        temperature: 0.7,
      })) {
        // Each delta must be a separate SSE with type "text-delta"
        send({ type: "text-delta", id: textBlockId, delta: chunk });
      }

      // 4) text-end
      send({ type: "text-end", id: textBlockId });

      // 5) finish
      send({ type: "finish" });

      // 6) required terminator
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

      controller.close();
    } catch (error) {
      // Optional: stream an error part (it will be appended to the assistant message)
      const errText = error instanceof Error ? error.message : "Unknown error";
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "error", errorText: errText })}\n\n`)
      );
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    }
  },
});

return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    // 👇 required by the AI SDK data stream protocol
    "x-vercel-ai-ui-message-stream": "v1",
  },
});
    
  } catch (error) {
    console.error("Chat API error:", error);
    
    // Return error as stream format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const errorMsg = `0:${JSON.stringify("An error occurred. Please try again.")}\n`;
        controller.enqueue(encoder.encode(errorMsg));
        controller.enqueue(encoder.encode(`d:{"finishReason":"error"}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        // ❌ 'text/event-stream' -> use plain text
        'Content-Type': 'text/plain; charset=utf-8',
        // Helpful for proxies (Cloudflare/Nginx) not to buffer
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
    
  }
}

function buildSystemPrompt(
  problemContext: any,
  contextChunks: string[]
): string {
  const hasContext = contextChunks.length > 0;

  let prompt = `You are an AI tutoring assistant designed to help students learn programming concepts. You are helping with the "${problemContext.title}" problem.

IMPORTANT RESTRICTIONS:
1. You can ONLY use information from the provided course materials below${
    hasContext ? "" : " (NO MATERIALS PROVIDED - see guidelines below)"
  }
2. You must NOT provide direct solutions or complete code implementations
3. You should guide students to think through problems step by step
4. If asked about topics not covered in the materials, politely redirect to the assignment content
5. Encourage learning through hints and questions rather than direct answers

PROBLEM CONTEXT:
Title: ${problemContext.title}
Description: ${problemContext.description}
`;

  if (hasContext) {
    prompt += `
COURSE MATERIALS (ONLY SOURCE OF INFORMATION):
${contextChunks
  .map((chunk, index) => `[Context ${index + 1}]: ${chunk}`)
  .join("\n\n")}

You must base ALL your responses on the above course materials. If the student asks about something not covered in these materials, explain that you can only help with topics covered in the course materials for this assignment.
`;
  } else {
    prompt += `
NO COURSE MATERIALS PROVIDED: Since no course materials have been uploaded for this assignment yet, you should:
1. Explain that specific course materials haven't been provided
2. Only offer general programming guidance related to the problem
3. Suggest the student refer to their course materials or ask their instructor for specific concepts
4. Still avoid giving direct solutions - focus on general problem-solving strategies
`;
  }

  prompt += `
RESPONSE GUIDELINES:
- Be encouraging and supportive
- Ask guiding questions to help the student think
- Break down complex problems into smaller steps
- Reference specific parts of the course materials when applicable
- If you cannot help with a question, explain why and redirect appropriately

Remember: Your goal is to facilitate learning, not to provide answers directly.`;

  return prompt;
}
