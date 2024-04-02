import { summarizeDiff } from '@/lib/ai/summarize-diff'
import { GithubClient } from '@/lib/github/create-github-client'
import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI } from '@langchain/openai'

interface SummarizeGithubPullRequestParams {
  pullRequest: {
    title: string
    body: string | null
    repo_id: number
    pull_number: number
    merged_at: string
    html_url: string
    base: {
      ref: string
    }
  }
  repo: string
  owner: string
  github: GithubClient
  issue: string | null
  contributor_id: number
  length: 'short' | 'long'
}

export async function summarizeGithubPullRequest(
  params: SummarizeGithubPullRequestParams,
) {
  const { pullRequest, github, repo, owner, issue, length: type } = params

  const diff = await github.rest.pulls
    .get({
      pull_number: pullRequest.pull_number,
      headers: {
        accept: 'application/vnd.github.v3.diff',
      },
      repo,
      owner,
    })
    .then((res) => res.data as unknown as string) // diff is a string
    .catch(() => null) // ignore fails. eg. too many files

  const summary = await getSummary({
    title: pullRequest.title,
    diff,
    issue,
    body: pullRequest.body,
    type,
  })

  return { summary, diff }
}

interface GetSummaryParams {
  title: string
  diff: string | null
  issue: string | null
  body: string | null
  type: 'short' | 'long'
}

async function getSummary(params: GetSummaryParams) {
  const { body, issue, diff, title, type } = params

  const diffSummary = diff ? await summarizeDiff({ diff }) : null
  if (diffSummary && !issue && !body) {
    return diffSummary
  }

  const input = await getInput({
    title,
    diffSummary,
    issue,
    body,
    type,
  })

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4' })

  return await model.invoke(input)
}

interface GetInputParams {
  title: string
  diffSummary: string | null
  issue: string | null
  body: string | null
  type: 'short' | 'long'
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

  return promptTemplate.format({
    title,
    diff: diffSummary,
    issue,
    body,
    rules,
  })
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
  const { type } = params
  if (type === 'long') {
    return rules.longSummary.join('\n')
  }

  if (type === 'short') {
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
