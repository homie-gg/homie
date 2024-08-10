import { logger } from '@/lib/log/logger'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

interface SummarizeDiffParams {
  diff: string
  logData?: Record<string, any>
}

export const chatGPTCharLimit = 384000 // gpt-4o-2024-05-13 128k tokens x 3

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

  const openAI = createOpenAIClient()

  let summary = ''

  const files = chunkDiffByFiles(diff)

  for (const file of files) {
    const result = await openAI.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful code assistant',
        },
        {
          role: 'user',
          content: `
  Summarize the following Pull Request DIFF. You MUST follow the following rules when generating the summary:
  - The DIFF will include the files, and changes made in a Pull Request.
  - Describe each change, and how it affects the application.
  - The summary should only be based on the DIFF. Do not generate the summary without a clear reference to the DIFF.
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.
  
  DIFF:
  ${file}
  `,
        },
      ],
    })

    const pageDiffSummary = result.choices[0].message.content

    logger.debug('Summarize Diff - Result', {
      ...logData,
      event: 'summarize_diff:result',
      ai_call: true,
      diff,
      page_diff_summary: pageDiffSummary,
    })

    summary += `\n${pageDiffSummary}`
  }

  return summary
}

/**
 * Create chunks of diff by files, so that each chunk
 * is less than the given chunk size. e.g. GPT char
 * limit.
 *
 * @param diff
 * @param chunkSize
 */
export function chunkDiffByFiles(
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
