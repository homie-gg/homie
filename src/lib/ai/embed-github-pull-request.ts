import { PineconeRecord } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { pineconeClient } from '@/lib/pinecone/create-pinecone-client'

interface EmbedGithubPullRequestParams {
  summary: string
  pull_request_id: number
  metadata: Record<string, any>
}

export async function embedGithubPullRequest(
  params: EmbedGithubPullRequestParams,
) {
  const { pull_request_id, summary, metadata } = params

  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  const embedding = await embedder.embedQuery(summary)

  const record: PineconeRecord = {
    id: `pull_request_${pull_request_id}`,
    values: embedding,
    metadata,
  }

  const index = pineconeClient.Index(process.env.PINECONE_INDEX_MAIN!)

  await index.upsert([record])
}
