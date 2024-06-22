import { extractCodeSnippets, prompt } from '@/lib/ai/extract-code-snippets'
import { v4 as uuid } from 'uuid'
import { chatGPTCharLimit, chunkDiff } from '@/lib/ai/summarize-diff'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { PineconeRecord } from '@pinecone-database/pinecone'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'

interface EmbedDiffParams {
  diff: string
  summary: string
  title: string
  url: string
  contributor: string
  organization_id: number
  metadata: Record<string, any>
  mergedAt: Date | null
}

export async function embedDiff(params: EmbedDiffParams) {
  const { diff, summary, title, url, contributor, metadata, mergedAt } = params

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
      const attributes = [
        `Pull Request ${title}`,
        `URL: ${url}`,
        `Contributed by ${contributor}`,
        `Changed: ${snippet}`,
      ]

      if (mergedAt) {
        attributes.push(`Merged at ${mergedAt.toISOString()}.`)
      }

      const text = attributes.join('. ')
      const embedding = await embedder.embedQuery(text)

      const record: PineconeRecord = {
        id: uuid(),
        values: embedding,
        metadata: {
          ...metadata,
          text,
        },
      }

      const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

      await index.upsert([record])
    }
  }
}
