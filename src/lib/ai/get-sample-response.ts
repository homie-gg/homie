import { getSampleResponsePrompt } from '@/lib/ai/get-sample-response-prompt'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

interface GetSampleResponseParams {
  gLevel: number
  positivityLevel: number
  affectionLevel: number
  emojiLevel: number
}

export async function getSampleResponse(params: GetSampleResponseParams) {
  const { gLevel, positivityLevel, affectionLevel, emojiLevel } = params

  const prompt = getSampleResponsePrompt({
    gLevel,
    positivityLevel,
    affectionLevel,
    emojiLevel,
  })

  const openAI = createOpenAIClient()

  const result = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return result.choices[0].message.content ?? 'Failed to get sample response'
}
