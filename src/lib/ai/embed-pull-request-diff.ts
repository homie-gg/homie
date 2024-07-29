import { extractCodeSnippets, prompt } from '@/lib/ai/extract-code-snippets'
import { v4 as uuid } from 'uuid'
import { chatGPTCharLimit, chunkDiff } from '@/lib/ai/summarize-diff'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { PineconeRecord } from '@pinecone-database/pinecone'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'

interface EmbedPullRequestDiffParams {
  diff: string
  summary: string
  pullRequest: {
    id: number
    title: string
    body: string
    html_url: string
    contributor_id: number
    organization_id: number
    merged_at: Date | null
  }
}

export async function embedPullRequestDiff(params: EmbedPullRequestDiffParams) {
  const { diff, summary, pullRequest } = params

  const chunks = chunkDiff(diff, chatGPTCharLimit - prompt.length / 3)

  for (const chunk of chunks) {
    const snippets = await extractCodeSnippets({
      diff: chunk,
      summary,
    })

    const embedder = createOpenAIEmbedder({
      modelName: 'text-embedding-3-large',
    })

    for (const snippet of snippets) {
      const text = `${pullRequest.title}\n${snippet}`
      const embedding = await embedder.embedQuery(text)

      const record: PineconeRecord = {
        id: uuid(),
        values: embedding,
        metadata: {
          type: 'pull_request_diff',
          text,
          code_snippet: snippet,
          pull_request_title: pullRequest.title,
          pull_request_description: pullRequest.body,
          pull_request_url: pullRequest.html_url,
          pull_request_summary: summary,
          contributor_id: pullRequest.contributor_id,
          organization_id: pullRequest.organization_id,
          merged_at: pullRequest.merged_at?.toISOString() ?? '',
        },
      }

      const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

      await index.upsert([record])
    }
  }
}