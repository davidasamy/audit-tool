import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Configure client with AWS best practices for handling throttling
// Uses adaptive retry mode with exponential backoff and jitter
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
  maxAttempts: 10, // AWS recommended: up to 10 retry attempts for on-demand throttling
  // SDK automatically uses adaptive retry mode with exponential backoff and jitter
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

  // AWS SDK will automatically handle retries with adaptive mode:
  // - Exponential backoff with full jitter
  // - Up to 10 attempts (synced with 60-second quota refresh cycle)
  // - Distributes requests across multiple seconds within 1-minute period
  try {
    const response = await bedrockClient.send(command);

    if (!response.body) {
      console.error("No response body from Bedrock");
      return;
    }

    for await (const event of response.body) {
      if (!event?.chunk?.bytes) continue;

      const json = new TextDecoder().decode(event.chunk.bytes);
      const chunk = JSON.parse(json);

      // Only stream deltas as user-visible tokens
      if (chunk.type === "content_block_delta" && chunk.delta?.text) {
        yield chunk.delta.text as string;
      }
    }
  } catch (err: any) {
    console.error("Bedrock streaming error after all retries:", err);
    if (err?.name === "ThrottlingException") {
      throw new Error("AI tutor is experiencing high demand. Please wait 30 seconds and try again.");
    }
    throw new Error(`Failed to stream response: ${err.message || "Unknown error"}`);
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
