import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

jest.mock('lib/open-ai/create-open-ai-client')

export const mockCreateOpenAIClient = createOpenAIClient as jest.Mock
