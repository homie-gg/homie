import { PineconeRecord } from '@pinecone-database/pinecone'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { v4 as uuid } from 'uuid'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'

interface EmbedPullRequestChanges {
  pullRequest: {
    id: number
    title: string
    body: string
    html_url: string
    contributor_id: number
    organization_id: number
    merged_at: Date | null
  }
  wasMergedToDefaultBranch: boolean
  summary: string
}

export async function embedPullRequestChanges(params: EmbedPullRequestChanges) {
  const { summary, pullRequest, wasMergedToDefaultBranch } = params

  const points = summary.split(/^-/gm)

  // Embed each PR point separately
  for (const point of points) {
    const text = `${pullRequest.title}\n${point}`

    const embedder = createOpenAIEmbedder({
      modelName: 'text-embedding-3-large',
    })

    const embedding = await embedder.embedQuery(text)

    const record: PineconeRecord = {
      id: uuid(),
      values: embedding,
      metadata: {
        text,
        type: 'pull_request_change',
        pull_request_id: pullRequest.id,
        pull_request_title: pullRequest.title,
        pull_request_description: pullRequest.body,
        pull_request_url: pullRequest.html_url,
        pull_request_summary: summary,
        organization_id: pullRequest.organization_id,
        contributor_id: pullRequest.contributor_id,
        merged_at: pullRequest.merged_at?.toISOString() ?? '',
        was_merged_to_default_branch: wasMergedToDefaultBranch,
      },
    }

    const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

    await index.upsert([record])
  }
}
