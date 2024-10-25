import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface CalculateTaskComplexityParams {
  name: string
  description: string
}

const calculateTaskCompexityResponse = z.object({
  score: z
    .number()
    .describe(
      'A numeric score from 0 to 100 indicating the complexity of the task.',
    ),
})

type CalculateTaskComplexityResult = {
  prompt: string
  error?: string
  score?: number
}

export async function calculateTaskComplexity(
  params: CalculateTaskComplexityParams,
): Promise<CalculateTaskComplexityResult> {
  const { name, description } = params

  const prompt = `
Given the following task, assign a complexity score on a scale of 0 to 100 where:

- 10 = simple UI additions, or changes
- 20 = New components, functions or classes
- 40 = Adds a new third-party integrations
- 100 = Significant refactors or major features

Task:
${name}
${description}`

  const client = new OpenAI()

  const chatCompletion = await client.beta.chat.completions.parse({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful experienced software engineer.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'gpt-4o-2024-08-06',
    response_format: zodResponseFormat(
      calculateTaskCompexityResponse,
      'calculateTaskCompexityResponse',
    ),
  })

  const output = chatCompletion.choices[0].message
  if (!output?.parsed || output.refusal) {
    return {
      prompt,
      error: output.refusal ?? 'Failed to get parsed output',
    }
  }

  return { prompt, score: output.parsed.score }
}
