import { Pinecone } from '@pinecone-database/pinecone'

let client: Pinecone | null

export const getPineconeClient = (): Pinecone => {
  if (client) {
    return client
  }

  client = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  })

  return client
}
