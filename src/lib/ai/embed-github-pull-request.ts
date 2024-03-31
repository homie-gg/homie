import { PineconeRecord } from '@pinecone-database/pinecone'
import { GithubPullRequest } from '@/lib/db/types'
import { OpenAIEmbeddings } from '@langchain/openai'
import { pineconeClient } from '@/lib/pinecone/create-pinecone-client'
import { v4 as uuid } from 'uuid'

interface EmbedGithubPullRequestParams {
  pullRequest: GithubPullRequest
}

export async function embedGithubPullRequest(
  params: EmbedGithubPullRequestParams,
) {
  const { pullRequest } = params

  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  const embedding = await embedder.embedQuery(pullRequest.summary)

  const record: PineconeRecord = {
    id: uuid(),
    values: embedding,
    metadata: {
      text: pullRequest.summary,
      ext_gh_pull_request_id: pullRequest.id,
      organization_id: pullRequest.organization_id,
      user_id: pullRequest.user_id,
      repo_id: pullRequest.repo_id,
    },
  }

  const index = pineconeClient.Index(process.env.PINECONE_INDEX_MAIN!)

  await index.upsert([record])
}
