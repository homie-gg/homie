import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'
import OpenAI from 'openai'

interface ExtractCodeSnippetsParams {
  diff: string
  summary: string
}

export async function extractCodeSnippets(params: ExtractCodeSnippetsParams) {
  const { diff, summary } = params

  const openAI = createOpenAIClient()

  const result = await openAI.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful code tool',
      },
      {
        role: 'user',
        content: `Given the following SUMMARY, extract out relevant snippets of code from the DIFF. You MUST 
follow the following rules when extracting:
- Only return code from the DIFF.
- Only look at files in the DIFF.
- Your answer must be in bullet points with one bullet point per snippet
- For each snippet, reference the file name, and describe why it is relevant.
- Do NOT make up code. You must have a clear reference to the code in DIFF.
- Do NOT use outside references.

SUMMARY:
${summary}

DIFF:
${diff}
`,
      },
    ],
  })

  return result.choices[0].message.content?.split(/^-/gm) ?? ''
}
