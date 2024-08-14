import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface CalculatePullRequestComplexityScoreParams {
  diff: string
}

const calculatePullRequestComplexityScoreResponse = z.object({
  complexity_score: z
    .number()
    .describe(
      'A score from 0 to 100 indicating the complexity of the pull request.',
    ),
})

type CalculatePullRequestComplexityScoreResult = {
  prompt: string
  error?: string
  complexity_score?: number
}

export async function calculatePullRequestComplexityScore(
  params: CalculatePullRequestComplexityScoreParams,
): Promise<CalculatePullRequestComplexityScoreResult> {
  const { diff } = params

  const prompt = `
Given the following Pull Request, assign a complexity score on a scale of 0 to 100 where:

- 10 = simple UI additions, or changes
- 20 = New components, functions or classes
- 40 = Adds a new third-party integrations
- 100 = Significant refactors or major features

Pull Request:
${diff}`

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
      calculatePullRequestComplexityScoreResponse,
      'calculatePullRequestComplexityScoreResponse',
    ),
  })

  const output = chatCompletion.choices[0].message
  if (!output?.parsed || output.refusal) {
    return {
      prompt,
      error: output.refusal ?? 'Failed to get parsed output',
    }
  }

  return { prompt, complexity_score: output.parsed.complexity_score }
}
