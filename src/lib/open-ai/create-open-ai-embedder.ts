import { OpenAIEmbeddings } from '@langchain/openai'

let embedder: OpenAIEmbeddings | null

export const createOpenAIEmbedder = (
  options?: Partial<OpenAIEmbeddings>,
): OpenAIEmbeddings => {
  if (embedder) {
    return embedder
  }

  embedder = new OpenAIEmbeddings(options)
  return embedder
}
