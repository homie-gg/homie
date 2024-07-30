import { getPineconeClient } from '@/lib/pinecone/pinecone-client'

export function getOrganizationVectorDB(organizationId: number) {
  const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

  const namespace = `organization_${organizationId}`
  return index.namespace(namespace)
}
