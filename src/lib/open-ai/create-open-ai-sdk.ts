import { OpenAI, ClientOptions } from 'openai'

let client: OpenAI | null

export const createOpenAISDK = (options?: ClientOptions): OpenAI => {
  if (client) {
    return client
  }

  client = new OpenAI(options)
  return client
}
