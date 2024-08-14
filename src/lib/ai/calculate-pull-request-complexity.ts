import { createOpenAISDK } from '@/lib/open-ai/create-open-ai-sdk'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface CalculatePullRequestComplexityParams {
  diff: string
}

const calculatePullRequestCompexityResponse = z.object({
  score: z
    .number()
    .describe(
      'A numeric score from 0 to 100 indicating the complexity of the pull request.',
    ),
})

type CalculatePullRequestComplexityResult = {
  prompt: string
  error?: string
  score?: number
}

export async function calculatePullRequestComplexity(
  params: CalculatePullRequestComplexityParams,
): Promise<CalculatePullRequestComplexityResult> {
  const { diff } = params

  const prompt = `
Given the following Pull Request, assign a complexity score on a scale of 0 to 100 where:

- 10 = simple UI additions, or changes
- 20 = New components, functions or classes
- 40 = Adds a new third-party integrations
- 100 = Significant refactors or major features

Pull Request:
${diff}`

  const client = createOpenAISDK()

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
      calculatePullRequestCompexityResponse,
      'calculatePullRequestCompexityResponse',
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
