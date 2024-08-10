import { summarizeDiff } from '@/lib/ai/summarize-diff'
import { logger } from '@/lib/log/logger'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

interface SummarizeCodeChangeParams {
  title: string
  diff: string | null
  issue: string | null
  conversation: string | null
  body: string | null
  length: 'short' | 'long'
  logData?: Record<string, any>
}

export async function summarizeCodeChange(params: SummarizeCodeChangeParams) {
  const { body, issue, diff, title, length, logData, conversation } = params

  logger.debug('Summarize Code Change - Start', {
    ...logData,
    event: 'summarize_code_change:start',
    body,
    issue,
    diff,
    title,
    length,
    conversation,
  })

  const diffSummary = diff ? await summarizeDiff({ diff, logData }) : null

  const rules = getRules({
    title,
    diffSummary,
    issue,
    body,
    length,
    conversation,
  })

  const openAI = createOpenAIClient()
  const result = await openAI.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful code assistant',
      },
      {
        role: 'user',
        content: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
- The TITLE is the pull request title.
- The CHANGES will be a summary of all the changes.
- The ISSUE will contain the description of a issue that this pull request aims to solve.
- The BODY will contain a description of what this pull request attempts to achieve.
- The CONVERSATION will background information to why this Pull Request is required.
- The summary should only be based on the CHANGES, ISSUE, BODY, and CONVERSATION. Do not generate the summary without a clear reference to the CHANGES, ISSUE, BODY, or CONVERSATION.
- Do not infer any initiatives, or features other than what has already been mentioned in the CHANGES, ISSUE, BODY, or CONVERSATION.
- Use bullet points to present the summary
- The summary should be a single list with no headings, or sub-lists
${rules}

TITLE: 
${title}
  
CHANGES:
${diffSummary ?? 'NONE'}
  
ISSUE:
${issue ?? 'NONE'}
  
BODY:
${body ?? 'NONE'}

CONVERSATION:
${conversation ?? 'NONE'}
`,
      },
    ],
  })

  const summary = result.choices[0].message.content

  logger.debug('Summarize Code Change - Result', {
    ...logData,
    event: 'summarize_code_change:result',
    ai_call: true,
    body,
    issue,
    diff,
    title,
    length,
    result,
    conversation,
    summary,
  })

  return summary ?? ''
}

interface GetInputParams {
  title: string
  diffSummary: string | null
  issue: string | null
  conversation: string | null
  body: string | null
  length: 'short' | 'long'
}

/**
 * Additional rules to append to the prompt
 */
const rules = {
  shortSummary: [
    '- The summary should be less than 5 points',
    '- Each point should be 1 to 2 sentences long.',
  ],
  longSummary: [
    '- Include references to code, and code snippets.',
    '- Explain the changes in files, and how they affect the application.',
    '- Include the file names, when describing changes.',
    '- Include the function names when describing changes.',
  ],
}

function getRules(params: GetInputParams): string {
  const { length } = params
  if (length === 'long') {
    return rules.longSummary.join('\n')
  }

  if (length === 'short') {
    return rules.shortSummary.join('\n')
  }

  return ''
}
