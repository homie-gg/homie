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

  const model = createOpenAIClient({
    temperature: 0,
    modelName: 'gpt-4o',
  })

  return model.invoke(prompt)
}
