import { PineconeRecord } from '@pinecone-database/pinecone'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { v4 as uuid } from 'uuid'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'

interface EmbedCodeChangeParams {
  title: string
  label: 'Pull Request' | 'Merge Request'
  url: string
  summary: string
  metadata: Record<string, any>
  contributor: string
  mergedAt: Date | null
}

export async function embedCodeChange(params: EmbedCodeChangeParams) {
  const { summary, metadata, contributor, label, title, url, mergedAt } = params

  const points = summary.split(/^-/gm)

  // Embed each PR point separately
  for (const point of points) {
    const attributes = [
      `${label} ${title}`,
      `URL: ${url}`,
      `Contributed by ${contributor}`,
      `Changed: ${point}`,
    ]

    if (mergedAt) {
      attributes.push(`Merged at ${mergedAt.toISOString()}.`)
    }
    const text = attributes.join('. ')

    const embedder = createOpenAIEmbedder({
      modelName: 'text-embedding-3-large',
    })

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
