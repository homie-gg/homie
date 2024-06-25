import { summarizeCodeChange } from '@/lib/ai/summarize-code-change'

jest.mock('lib/ai/summarize-code-change')

export const mockSummarizeCodeChange = summarizeCodeChange as jest.Mock
