import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'

jest.mock('lib/open-ai/create-open-ai-chat-client')

export const mockCreateOpenAIChatClient = createOpenAIChatClient as jest.Mock
