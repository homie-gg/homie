import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'

jest.mock('lib/open-ai/create-open-ai-embedder')

export const mockCreateOpenAIEmbedder = createOpenAIEmbedder as jest.Mock
