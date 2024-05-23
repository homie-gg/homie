import { PineconeRecord } from '@pinecone-database/pinecone'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { v4 as uuid } from 'uuid'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'

interface EmbedSlackConversationParams {
  messageUrl: string
  summary: string
  metadata: Record<string, any>
  savedAt: Date
}

export async function embedSlackConversation(
  params: EmbedSlackConversationParams,
) {
  const { summary, metadata, messageUrl, savedAt } = params

  const attributes = [
    'Conversation: ',
    summary,
    `Message URL: ${messageUrl}`,
    `Saved at: ${savedAt}`,
  ]

  const text = attributes.join(' | ')

  const embedder = createOpenAIEmbedder({
    modelName: 'text-embedding-3-large',
  })

  const embedding = await embedder.embedQuery(text)

  const record: PineconeRecord = {
    id: uuid(),
    values: embedding,
    metadata: {
      ...metadata,
      text,
    },
  }

  const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

  await index.upsert([record])
}
