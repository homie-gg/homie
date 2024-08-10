import { PineconeRecord } from '@pinecone-database/pinecone'
import { v4 as uuid } from 'uuid'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

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

  const openAI = createOpenAIClient()
  const embedding = (
    await openAI.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    })
  ).data[0].embedding

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
