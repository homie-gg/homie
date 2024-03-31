import { PineconeRecord } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { pineconeClient } from '@/lib/pinecone/create-pinecone-client'
import { v4 as uuid } from 'uuid'

interface EmbedGithubPullRequestParams {
  pullRequest: {
    summary: string
    ext_gh_pull_request_id: number
    organization_id: number
    contributor_id: number
    repo_id: number
  }
  issue: string | null
}

export async function embedGithubPullRequest(
  params: EmbedGithubPullRequestParams,
) {
  const {
    pullRequest: {
      summary,
      ext_gh_pull_request_id,
      contributor_id,
      repo_id,
      organization_id,
    },
  } = params

  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  const embedding = await embedder.embedQuery(summary)

  const record: PineconeRecord = {
    id: uuid(),
    values: embedding,
    metadata: {
      text: summary,
      ext_gh_pull_request_id,
      organization_id,
      contributor_id,
      repo_id,
    },
  }

  const index = pineconeClient.Index(process.env.PINECONE_INDEX_MAIN!)

  await index.upsert([record])

  return {
    metadata: record.metadata ?? {},
  }
}
