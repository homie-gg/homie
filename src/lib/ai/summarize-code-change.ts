import { summarizeDiff } from '@/lib/ai/summarize-diff'
import { logger } from '@/lib/log/logger'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'
import { PromptTemplate } from '@langchain/core/prompts'

interface SummarizeCodeChangeParams {
  title: string
  diff: string | null
  issue: string | null
  body: string | null
  length: 'short' | 'long'
  logData?: Record<string, any>
}

export async function summarizeCodeChange(params: SummarizeCodeChangeParams) {
  const { body, issue, diff, title, length, logData } = params

  logger.debug('Summarize Code Change - Start', {
    ...logData,
    event: 'summarize_code_change:start',
    body,
    issue,
    diff,
    title,
    length,
  })

  const diffSummary = diff ? await summarizeDiff({ diff, logData }) : null

  const input = await getInput({
    title,
    diffSummary,
    issue,
    body,
    length,
  })

  const model = createOpenAIClient({
    temperature: 0,
    modelName: 'gpt-4o',
  })

  const result = await model.invoke(input)

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
    input,
  })

  return result
}

interface GetInputParams {
  title: string
  diffSummary: string | null
  issue: string | null
  body: string | null
  length: 'short' | 'long'
}

/**
 * Get the appropriate prompt input based on the available data.
 */
function getInput(params: GetInputParams) {
  const { title, diffSummary, issue, body } = params

  const template = getTemplate(params)

  const rules = getRules(params)

  const promptTemplate = new PromptTemplate({
    template,
    inputVariables: ['title', 'diff', 'issue', 'body', 'rules'],
  })

  const input = promptTemplate.format({
    title,
    diff: diffSummary,
    issue,
    body,
    rules,
  })

  return input
}

function getTemplate(params: GetInputParams) {
  const { diffSummary, issue, body } = params
  if (diffSummary && issue && !body) {
    return prompts.diffAndIssue
  }

  if (!diffSummary && issue && !body) {
    return prompts.issueOnly
  }

  if (!diffSummary && issue && body) {
    return prompts.issueAndBody
  }

  if (!diffSummary && !issue && body) {
    return prompts.bodyOnly
  }

  return prompts.allVariables
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

const prompts = {
  diffAndIssue: `Write a Pull Request summary. You MUST follow the following rules when generating the summary:
- The TITLE is the pull request title.
- The CHANGES will be a summary of all the changes.
- The ISSUE will contain the description of the issue that this pull request aims to solve.
- The summary should only be based on the CHANGES, and ISSUE. Do not generate the summary without a clear reference to CHANGES, or ISSUE.
- Do not infer any initiatives, or features other than what has already been mentioned in the CHANGES, or ISSUE.
- Do not include a conclusion.
- Use bullet points to present the summary
- The summary should be a single list with no headings, or sub-lists
{rules}
  
TITLE: 
{title}

CHANGES:
{diff}
  
ISSUE:
{issue}`,
  issueOnly: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
- The TITLE is the pull request title.
- The ISSUE will contain the description of an issue that this pull request aims to solve.
- The summary should only be based on the ISSUE only. Do not generate the summary without a clear reference to the ISSUE.
- Do not infer any initiatives, or features other than what has already been mentioned in the ISSUE.
- Do not include a conclusion.
- Use bullet points to present the summary
- The summary should be a single list with no headings, or sub-lists
{rules}

TITLE: 
{title}

ISSUE: 
{issue}
  `,
  issueAndBody: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
- The TITLE is the pull request title.
- The ISSUE will contain the description of a issue that this pull request aims to solve.
- The BODY will contain a description of what this pull request attempts to achieve.
- The summary should only be based on the ISSUE, and BODY. Do not generate the summary without a clear reference to the ISSUE, OR BODY.
- Do not infer any initiatives, or features other than what has already been mentioned in the ISSUE, or BODY.
- Do not include a conclusion.
- Use bullet points to present the summary
- The summary should be a single list with no headings, or sub-lists
{rules}

TITLE: 
{title}
  
ISSUE:
{issue}
  
BODY:
{body}
`,
  bodyOnly: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
- The TITLE is the pull request title.
- The BODY will contain a description of what this pull request attempts to achieve.
- The summary should only be based on the BODY only. Do not generate the summary without a clear reference to the BODY.
- Do not infer any initiatives, or features other than what has already been mentioned in the ISSUE, or BODY.
- Do not include a conclusion.
- Use bullet points to present the summary
- The summary should be a single list with no headings, or sub-lists
{rules}

TITLE: 
{title}

BODY: 
{body}
`,
  allVariables: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
- The TITLE is the pull request title.
- The CHANGES will be a summary of all the changes.
- The ISSUE will contain the description of a issue that this pull request aims to solve.
- The BODY will contain a description of what this pull request attempts to achieve.
- The summary should only be based on the CHANGES, ISSUE, and BODY. Do not generate the summary without a clear reference to the CHANGES, ISSUE, OR BODY.
- Do not infer any initiatives, or features other than what has already been mentioned in the CHANGES, ISSUE, or BODY.
- Use bullet points to present the summary
- The summary should be a single list with no headings, or sub-lists
{rules}

TITLE: 
{title}
  
CHANGES:
{diff}
  
ISSUE:
{issue}
  
BODY:
{body}
`,
}
