import { OpenAI, OpenAIBaseInput } from '@langchain/openai'

let client: OpenAI | null

export const createOpenAIClient = (
  options?: Partial<OpenAIBaseInput>,
): OpenAI => {
  if (client) {
    return client
  }

  client = new OpenAI(options)
  return client
}
