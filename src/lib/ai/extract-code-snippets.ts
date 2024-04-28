import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'
import { PromptTemplate } from '@langchain/core/prompts'

interface ExtractCodeSnippetsParams {
  diff: string
  summary: string
}

export async function extractCodeSnippets(params: ExtractCodeSnippetsParams) {
  const { diff, summary } = params

  const model = createOpenAIClient({
    temperature: 0,
    modelName: 'gpt-3.5-turbo',
  })

  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['summary', 'diff'],
  })

  const input = await promptTemplate.format({ diff, summary })

  return (await model.invoke(input)).split(/^-/gm)
}

export const prompt = `Given the following SUMMARY, extract out relevant snippets of code from the DIFF. You MUST 
follow the following rules when extracting:
- Only return code from the DIFF.
- Only look at files in the DIFF.
- Your answer must be in bullet points with one bullet point per snippet
- For each snippet, reference the file name, and describe why it is relevant.
- Do NOT make up code. You must have a clear reference to the code in DIFF.
- Do NOT use outside references.

SUMMARY:
{summary}

DIFF:
{diff}
`
