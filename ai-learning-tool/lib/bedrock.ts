import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

export interface BedrockStreamOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function fullJitter(base: number) {
  return Math.floor(Math.random() * base);
}

/**
 * Stream responses from Claude Sonnet 4 via AWS Bedrock
 */
export async function* streamBedrockResponse(
  options: BedrockStreamOptions
): AsyncGenerator<string> {
  const {
    prompt,
    systemPrompt = "You are a helpful AI tutor.",
    maxTokens = 2048,
    temperature = 0.7,
  } = options;

  const modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  };

  const command = new InvokeModelWithResponseStreamCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  let attempts = 0;
  const maxAttempts = 6;

  while (true) {
    try {
      const response = await bedrockClient.send(command);

      if (!response.body) return;

      for await (const event of response.body) {
        if (!event?.chunk?.bytes) continue;

        const json = new TextDecoder().decode(event.chunk.bytes);
        const chunk = JSON.parse(json);

        // Only stream deltas as user-visible tokens
        if (chunk.type === "content_block_delta" && chunk.delta?.text) {
          yield chunk.delta.text as string;
        }
        // You can log other types if helpful for debugging:
        // else if (chunk.type !== "message_delta") console.log(chunk);
      }
      break; // finished streaming
    } catch (err: any) {
      // Handle throttling with full-jitter exponential backoff
      if (err?.name === "ThrottlingException" && attempts < maxAttempts - 1) {
        const base = Math.min(1000 * 2 ** attempts, 30_000);
        await sleep(fullJitter(base));
        attempts++;
        continue;
      }
      console.error("Bedrock streaming error:", err);
      throw new Error("Failed to stream response from Claude");
    }
  }
}

/**
 * Generate embeddings using AWS Titan Embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const modelId = "amazon.titan-embed-text-v1";
  const payload = { inputText: text };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  if (!response.body) throw new Error("No embedding returned from Titan model");

  const body = new TextDecoder().decode(response.body);
  const result = JSON.parse(body);
  return result.embedding || [];
}
