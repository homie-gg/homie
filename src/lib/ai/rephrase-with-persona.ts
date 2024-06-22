import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

interface RephraseWithPersonaParams {
  gLevel: number
  affectionLevel: number
  positivityLevel: number
  emojiLevel: number
  text: string
}

export function rephraseWithPersona(params: RephraseWithPersonaParams) {
  const { gLevel, affectionLevel, positivityLevel, emojiLevel, text } = params

  const persona =
    gLevel < 3 ? 'boring professor' : gLevel < 6 ? 'teenager' : 'homie g'

  const prompt = `Act as a ${persona} and ${positivityLevel}/10 positive person and you ${affectionLevel > 3 ? `${affectionLevel}/10 like me` : affectionLevel === 0 ? 'hate me' : ''} and use ${emojiLevel}/10 emojis to rephrase the following TEXT.
  
TEXT:
${text}
`
  const model = createOpenAIClient({
    temperature: 0,
    modelName: 'gpt-4o',
  })

  return model.invoke(prompt)
}
