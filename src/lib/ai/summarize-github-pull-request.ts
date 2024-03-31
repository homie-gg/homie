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
  }
  repo: string
  owner: string
  github: GithubClient
  issue: string | null
}

export async function summarizeGithubPullRequest(
  params: SummarizeGithubPullRequestParams,
) {
  const { pullRequest, github, repo, owner, issue } = params

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

  const diffSummary = diff ? await summarizeDiff({ diff }) : null

  if (diffSummary && !issue && !pullRequest.body) {
    return diffSummary
  }

  const input = await getInput({
    title: pullRequest.title,
    diffSummary,
    issue,
    body: pullRequest.body,
  })

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4' })

  const summary = await model.invoke(input)

  return summary
}

interface GetInputParams {
  title: string
  diffSummary: string | null
  issue: string | null
  body: string | null
}

/**
 * Get the appropriate prompt input based on the available data.
 */
function getInput(params: GetInputParams) {
  const { title, diffSummary, issue, body } = params

  if (diffSummary && issue && !body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.diffAndIssue,
      inputVariables: ['title', 'diff', 'issue'],
    })

    return promptTemplate.format({
      title,
      diff: diffSummary,
      issue,
    })
  }

  if (!diffSummary && issue && !body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.issueOnly,
      inputVariables: ['title', 'issue'],
    })

    return promptTemplate.format({
      title,
      issue,
    })
  }

  if (!diffSummary && issue && body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.issueAndBody,
      inputVariables: ['title', 'issue', 'body'],
    })

    return promptTemplate.format({
      title,
      issue,
      body,
    })
  }

  if (!diffSummary && !issue && body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.bodyOnly,
      inputVariables: ['title', 'body'],
    })

    return promptTemplate.format({
      title,
      body,
    })
  }

  const promptTemplate = new PromptTemplate({
    template: prompts.complete,
    inputVariables: ['title', 'diff', 'issue', 'body'],
  })

  return promptTemplate.format({
    title,
    diff: diffSummary,
    issue,
    body,
  })
}

const prompts = {
  diffAndIssue: `Write a Pull Request summary. You MUST follow the following rules when generating the summary:
  - The TITLE is the pull request title.
  - The CHANGES will be a summary of all the changes.
  - The ISSUE will contain the description of the issue that this pull request aims to solve.
  - The summary should only be based on the CHANGES, and ISSUE. Do not generate the summary without a clear reference to CHANGES, or ISSUE.
  - Do not infer any initiatives, or features other than what has already been mentioned in the CHANGES, or ISSUE.
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - The summary should be a single list with no headings, or sub-lists.
  - Do not include a conclusion.
  
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
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - The summary should be a single list with no headings, or sub-lists.
  - Do not include a conclusion.

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
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - The summary should be a single list with no headings, or sub-lists.
  - Do not include a conclusion.

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
  - Use bullet points to present the summary.
  - The summary should be a single list with no headings, or sub-lists.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.

  TITLE: 
  {title}

  BODY: 
  {body}
  `,
  complete: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
  - The TITLE is the pull request title.
  - The CHANGES will be a summary of all the changes.
  - The ISSUE will contain the description of a issue that this pull request aims to solve.
  - The BODY will contain a description of what this pull request attempts to achieve.
  - The summary should only be based on the CHANGES, ISSUE, and BODY. Do not generate the summary without a clear reference to the CHANGES, ISSUE, OR BODY.
  - Do not infer any initiatives, or features other than what has already been mentioned in the CHANGES, ISSUE, or BODY.
  - Use bullet points to present the summary.
  - The summary should be a single list with no headings, or sub-lists.
  - The summary should be less than 5 points.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.

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
