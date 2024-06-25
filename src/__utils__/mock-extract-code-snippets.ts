import { extractCodeSnippets } from '@/lib/ai/extract-code-snippets'

jest.mock('lib/ai/extract-code-snippets')

export const mockExtractCodeSnippets = extractCodeSnippets as jest.Mock
