import { createSlackClient } from '@/lib/slack/create-slack-client'

jest.mock('lib/slack/create-slack-client')

export const mockCreateSlackClient = createSlackClient as jest.Mock
