import OpenAI, { ClientOptions } from 'openai'

let client: OpenAI | null

export const createOpenAIClient = (options?: ClientOptions): OpenAI => {
  if (client) {
    return client
  }

  client = new OpenAI(options)
  return client
}
