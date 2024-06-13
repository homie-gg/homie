import { summarizeTask } from '@/lib/ai/summarize-task'

jest.mock('lib/ai/summarize-task')

export const mockSummarizeTask = summarizeTask as jest.Mock
