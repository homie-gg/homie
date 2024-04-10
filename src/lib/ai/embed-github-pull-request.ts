import { PineconeRecord } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { pineconeClient } from '@/lib/pinecone/create-pinecone-client'
import { v4 as uuid } from 'uuid'

interface EmbedGithubPullRequestParams {
  summary: string
  metadata: Record<string, any>
  pullRequest: {
    title: string
    html_url: string
    merged_at: Date | null
  }
  contributor: string
}

export async function embedGithubPullRequest(
  params: EmbedGithubPullRequestParams,
) {
  const { pullRequest, summary, metadata, contributor } = params

  const points = summary.split(/^-/gm)

  // Embed each PR point separately
  for (const point of points) {
    const attributes = [
      `Pull Request ${pullRequest.title}`,
      `URL: ${pullRequest.html_url}`,
      `Contributed by ${contributor}`,
      `Changed: ${point}`,
    ]

    if (pullRequest.merged_at) {
      attributes.push(`Merged at ${pullRequest.merged_at.toISOString()}.`)
    }
    const text = attributes.join('. ')

    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
    })

    const embedding = await embedder.embedQuery(text)

    const record: PineconeRecord = {
      id: uuid(),
      values: embedding,
      metadata,
    }

    const index = pineconeClient.Index(process.env.PINECONE_INDEX_MAIN!)

    await index.upsert([record])
  }
}
