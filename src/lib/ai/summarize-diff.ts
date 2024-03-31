import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI } from '@langchain/openai'
import { Document } from '@langchain/core/documents'
import { loadSummarizationChain } from 'langchain/chains'

interface SummarizeDiffParams {
  diff: string
}

export const chatGPTCharLimit = 4000

const commonLockFiles = [
  'package-lock.json',
  'composer.lock',
  'requirements.lock',
]

export async function summarizeDiff(
  params: SummarizeDiffParams,
): Promise<string> {
  const { diff } = params

  const documents = diff
    // split by file
    .split(/(?=diff --git)/)
    // remove lock files
    .filter(
      (file) => !commonLockFiles.some((lockFile) => file.includes(lockFile)),
    )
    // Shorten each file to max limit
    .map((file) => file.substring(0, chatGPTCharLimit))
    // Combine files as long as they are below limit to reduce
    // the amount of api calls
    .reduce((acc, file) => {
      const lastIndex = acc.length - 1
      const lastItem = acc[lastIndex] ?? ''

      const appended = lastItem + '\n' + file
      if (appended.length > 4000) {
        return [...acc, file]
      }

      return [...acc.slice(0, lastIndex), appended]
    }, [] as string[])
    .map((file) => new Document({ pageContent: file }))

  const model = new OpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo',
  })

  const summarizeChain = loadSummarizationChain(model, {
    type: 'map_reduce',
    combineMapPrompt: PromptTemplate.fromTemplate(mapPrompt),
    combinePrompt: PromptTemplate.fromTemplate(combinePrompt),
    verbose: false,
  })

  const result = await summarizeChain.invoke({
    input_documents: documents,
  })

  return result.text
}

const mapPrompt = `
Summarize the following Pull Request DIFF. You MUST follow the following rules when generating the summary:
- The DIFF will include the files, and changes made in a Pull Request.
- Describe each change, and how it affects the application.
- The summary should only be based on the DIFF. Do not generate the summary without a clear reference to the DIFF.
- Use bullet points to present the summary.
- Each point should be 1 to 2 sentences long.
- Do not include a conclusion.

DIFF:
{text}
`

const combinePrompt = `
Summarize the following CHANGES for a Pull Request. You MUST follow the following rules when generating the summary:
- The CHANGES will include all the changes made to the pull request.
- Combine, and summarize any related key points, but do not omit information.
- The summary should only be based on the CHANGES. Do not generate the summary without a clear reference to the CHANGES.
- Use bullet points to present the summary.
- Each point should be 1 to 2 sentences long.
- Do not include a conclusion.

CHANGES:
{text}
`
