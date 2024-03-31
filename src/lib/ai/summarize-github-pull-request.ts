import { summarizeDiff } from '@/lib/ai/summarize-diff'
import { GithubClient } from '@/lib/github/create-github-client'
import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI } from '@langchain/openai'

interface SummarizeGithubPullRequestParams {
  pullRequest: {
    body: string | null
    repo_id: number
    pull_number: number
  }
  repo: string
  owner: string
  github: GithubClient
  issue: string | null
  user_id: number
}

export async function summarizeGithubPullRequest(
  params: SummarizeGithubPullRequestParams,
) {
  const { pullRequest, github, repo, owner, issue, user_id } = params

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
    diffSummary,
    issue,
    body: pullRequest.body,
  })

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4' })

  const summary = await model.invoke(input)

  return summary
}

interface GetInputParams {
  diffSummary: string | null
  issue: string | null
  body: string | null
}

/**
 * Get the appropriate prompt input based on the available data.
 */
function getInput(params: GetInputParams) {
  const { diffSummary, issue, body } = params

  if (diffSummary && issue && !body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.diffAndIssue,
      inputVariables: ['diff', 'issue'],
    })

    return promptTemplate.format({
      diff: diffSummary,
      issue,
    })
  }

  if (!diffSummary && issue && !body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.issueOnly,
      inputVariables: ['issue'],
    })

    return promptTemplate.format({
      issue,
    })
  }

  if (!diffSummary && issue && body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.issueAndBody,
      inputVariables: ['issue', 'body'],
    })

    return promptTemplate.format({
      issue,
      body,
    })
  }

  if (!diffSummary && !issue && body) {
    const promptTemplate = new PromptTemplate({
      template: prompts.bodyOnly,
      inputVariables: ['body'],
    })

    return promptTemplate.format({
      body,
    })
  }

  const promptTemplate = new PromptTemplate({
    template: prompts.complete,
    inputVariables: ['diff', 'issue', 'body'],
  })

  return promptTemplate.format({
    diff: diffSummary,
    issue,
    body,
  })
}

const prompts = {
  diffAndIssue: `Create a Pull Request. You MUST follow the following rules when generating the summary:
  - The CHANGES will be a summary of all the changes.
  - The ISSUE will contain the description of the issue that this pull request aims to solve.
  - The summary should only be based on the CHANGES, and ISSUE. Do not generate the summary without a clear reference to CHANGES, or ISSUE.
  - Do not infer any initiatives, or features other than what has already been mentioned in the CHANGES, or ISSUE.
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.
  - 
  
  CHANGES:
  {diff}
  
  ISSUE:
  {issue}`,
  issueOnly: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
  - The ISSUE will contain the description of an issue that this pull request aims to solve.
  - The summary should only be based on the ISSUE only. Do not generate the summary without a clear reference to the ISSUE.
  - Do not infer any initiatives, or features other than what has already been mentioned in the ISSUE.
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.
  - 

  ISSUE: 
  {issue}
  `,
  issueAndBody: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
  - The ISSUE will contain the description of a issue that this pull request aims to solve.
  - The BODY will contain a description of what this pull request attempts to achieve.
  - The summary should only be based on the ISSUE, and BODY. Do not generate the summary without a clear reference to the ISSUE, OR BODY.
  - Do not infer any initiatives, or features other than what has already been mentioned in the ISSUE, or BODY.
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.
  - 
  
  ISSUE:
  {issue}
  
  BODY:
  {body}
  `,
  bodyOnly: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
  - The BODY will contain a description of what this pull request attempts to achieve.
  - The summary should only be based on the BODY only. Do not generate the summary without a clear reference to the BODY.
  - Do not infer any initiatives, or features other than what has already been mentioned in the ISSUE, or BODY.
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.

  BODY: 
  {body}
  `,
  complete: `Create a Pull Request summary from the information below. You MUST follow the following rules when generating the summary:
  - The CHANGES will be a summary of all the changes.
  - The ISSUE will contain the description of a issue that this pull request aims to solve.
  - The BODY will contain a description of what this pull request attempts to achieve.
  - The summary should only be based on the CHANGES, ISSUE, and BODY. Do not generate the summary without a clear reference to the CHANGES, ISSUE, OR BODY.
  - Do not infer any initiatives, or features other than what has already been mentioned in the CHANGES, ISSUE, or BODY.
  - Use bullet points to present the summary.
  - Each point should be 1 to 2 sentences long.
  - Do not include a conclusion.
  
  CHANGES:
  {diff}
  
  ISSUE:
  {issue}
  
  BODY:
  {body}
  `,
}
