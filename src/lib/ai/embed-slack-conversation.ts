import { PineconeRecord } from '@pinecone-database/pinecone'
import { v4 as uuid } from 'uuid'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'

interface EmbedSlackConversationParams {
  messageUrl: string
  summary: string
  savedAt: Date
  organization: {
    id: number
  }
}

export async function embedSlackConversation(
  params: EmbedSlackConversationParams,
) {
  const { summary, messageUrl, savedAt, organization } = params

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
      type: 'conversation',
      organization_id: organization.id,
      text,
    },
  }

  const vectorDB = getOrganizationVectorDB(organization.id)

  await vectorDB.upsert([record])
}
