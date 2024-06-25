import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'

interface ExtractCodeSnippetsParams {
  diff: string
  summary: string
}

export async function extractCodeSnippets(params: ExtractCodeSnippetsParams) {
  const { diff, summary } = params

  const model = createOpenAIChatClient({
    temperature: 0,
    modelName: 'gpt-4o',
  })

  const chatPrompt = ChatPromptTemplate.fromTemplate(prompt)
  const parser = new StringOutputParser()
  const chain = RunnableSequence.from([chatPrompt, model, parser])

  return (
    await chain.invoke({
      diff,
      summary,
    })
  ).split(/^-/gm)
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
