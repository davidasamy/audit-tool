import { convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, problemContext }: { messages: UIMessage[]; problemContext: any } = await req.json()

  const systemPrompt = `You are an educational AI assistant helping students learn to code. Your role is to guide students to discover solutions themselves, not to give them direct answers.

Current Problem: ${problemContext.title}
Problem Description: ${problemContext.description}

Guidelines for your responses:
1. NEVER provide complete code solutions or direct answers
2. Ask guiding questions that help students think through the problem
3. Explain concepts and algorithms when asked
4. Help debug logic by asking what they expected vs what happened
5. Suggest approaches or data structures without implementing them
6. Encourage students to break down the problem into smaller steps
7. Provide hints that lead to understanding, not just answers
8. If a student is stuck, give progressively more specific hints
9. Celebrate their progress and correct thinking
10. Keep responses concise and focused on learning

Remember: Your goal is to help them LEARN, not just complete the assignment.`

  const prompt = convertToModelMessages([
    {
      id: "system",
      role: "system" as const,
      parts: [{ type: "text" as const, text: systemPrompt }],
    },
    ...messages,
  ])

  const result = streamText({
    model: "openai/gpt-4o-mini",
    messages: prompt,
    abortSignal: req.signal,
    temperature: 0.7,
    maxOutputTokens: 500,
  })

  return result.toUIMessageStreamResponse()
}
