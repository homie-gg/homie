import { createOpenAISDK } from '@/lib/open-ai/create-open-ai-sdk'

jest.mock('lib/open-ai/create-open-ai-sdk')

export const mockCreateOpenAISDK = createOpenAISDK as jest.Mock
