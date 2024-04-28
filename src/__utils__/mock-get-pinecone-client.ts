import { getPineconeClient } from '@/lib/pinecone/pinecone-client'

jest.mock('lib/pinecone/pinecone-client')

export const mockGetPineconeClient = getPineconeClient as jest.Mock
