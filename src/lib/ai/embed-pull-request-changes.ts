import { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone'
import { v4 as uuid } from 'uuid'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'

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

export interface PullRequestChangeMetadata extends RecordMetadata {
  type: 'pull_request_change'
  text: string
  pull_request_id: number
  pull_request_title: string
  pull_request_description: string
  pull_request_url: string
  pull_request_summary: string
  organization_id: number
  contributor_id: number
  merged_at: string
  was_merged_to_default_branch: boolean
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

    const metadata: PullRequestChangeMetadata = {
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
    }

    const record: PineconeRecord = {
      id: uuid(),
      values: embedding,
      metadata,
    }

    const vectorDB = getOrganizationVectorDB(pullRequest.organization_id)

    await vectorDB.upsert([record])
  }
}
