import { PromptTemplate } from '@langchain/core/prompts'
import { Document } from '@langchain/core/documents'
import { loadSummarizationChain } from 'langchain/chains'
import { logger } from '@/lib/log/logger'
import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'

interface SummarizeDiffParams {
  diff: string
  logData?: Record<string, any>
}

export const chatGPTCharLimit = 384000 // gpt-4o 128k tokens x 3

const commonLockFiles = [
  'package-lock.json',
  'composer.lock',
  'requirements.lock',
]

export async function summarizeDiff(
  params: SummarizeDiffParams,
): Promise<string> {
  const { diff, logData } = params

  logger.debug('Summarize Diff - Start', {
    ...logData,
    event: 'summarize_diff:start',
    diff,
  })

  const documents = chunkDiff(diff).map(
    (file) => new Document({ pageContent: file }),
  )

  const model = createOpenAIChatClient({
    temperature: 0,
    modelName: 'gpt-4o',
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

  logger.debug('Summarize Diff - Result', {
    ...logData,
    event: 'summarize_diff:result',
    ai_call: true,
    diff,
    documents,
    map_prompt: mapPrompt,
    combine_prompt: combinePrompt,
  })

  return result.text
}

/**
 * Create chunks of diff by files, so that each chunk
 * is less than the given chunk size. e.g. GPT char
 * limit.
 *
 * @param diff
 * @param chunkSize
 */
export function chunkDiff(
  diff: string,
  chunkSize = chatGPTCharLimit,
): string[] {
  return (
    diff
      // split by file
      .split(/(?=diff --git)/)
      // remove lock files
      .filter(
        (file) => !commonLockFiles.some((lockFile) => file.includes(lockFile)),
      )
      // Shorten each file to max limit
      .map((file) => file.substring(0, chunkSize))
      // Combine files as long as they are below limit to reduce
      // the amount of api calls
      .reduce((acc, file) => {
        const lastIndex = acc.length - 1
        const lastItem = acc[lastIndex] ?? ''

        const appended = lastItem + '\n' + file
        if (appended.length > chunkSize) {
          return [...acc, file]
        }

        return [...acc.slice(0, lastIndex), appended]
      }, [] as string[])
  )
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
