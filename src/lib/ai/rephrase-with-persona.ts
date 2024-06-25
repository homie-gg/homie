import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

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

  const chatPrompt = ChatPromptTemplate.fromTemplate(prompt)

  const parser = new StringOutputParser()
  const model = createOpenAIChatClient({
    temperature: 0,
    modelName: 'gpt-4o',
  })
  const chain = RunnableSequence.from([chatPrompt, model, parser])

  return chain.invoke({})
}
