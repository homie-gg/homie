import { extractCodeSnippets, prompt } from '@/lib/ai/extract-code-snippets'
import { v4 as uuid } from 'uuid'
import { chunkDiff } from '@/lib/ai/summarize-diff'
import { pineconeClient } from '@/lib/pinecone/create-pinecone-client'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeRecord } from '@pinecone-database/pinecone'

interface EmbedDiffParams {
  diff: string
  summary: string
  pullRequest: {
    id: number
    title: string
    html_url: string
    ext_gh_pull_request_id: number
    repo_id: number
    contributor_id: number
  }
  organization_id: number
}

export async function embedDiff(params: EmbedDiffParams) {
  const { diff, summary, pullRequest, organization_id } = params

  const chunks = chunkDiff(diff, 4000 - prompt.length)

  for (const chunk of chunks) {
    const snippets = await extractCodeSnippets({
      diff: chunk,
      summary,
    })

    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
    })

    for (const snippet of snippets) {
      const text = `Pull Request ${pullRequest.title}. URL: ${pullRequest.html_url}. Changed: ${snippet}`
      const embedding = await embedder.embedQuery(text)

      const metadata = {
        text,
        organization_id,
        pull_request_id: pullRequest.id,
        ext_gh_pull_request_id: pullRequest.ext_gh_pull_request_id,
        repo_id: pullRequest.repo_id,
        contributor_id: pullRequest.contributor_id,
      }
      const record: PineconeRecord = {
        id: uuid(),
        values: embedding,
        metadata,
      }

      const index = pineconeClient.Index(process.env.PINECONE_INDEX_MAIN!)

      await index.upsert([record])
    }
  }

  return null
}
