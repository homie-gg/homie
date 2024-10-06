import { createGithubClient } from '@/lib/github/create-github-client'
import { getGithubDefaultBranch } from '@/lib/github/get-default-branch'
import { getGithubAccessToken } from '@/lib/github/get-github-access-token'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { cloneRepository } from '@/lib/git/clone-repository'
import { deleteRepository } from '@/lib/git/delete-repository'
import { getWriteCodeCommand } from '@/lib/ai/get-write-code-command'
import { parseWriteCodeResult } from '@/lib/ai/parse-write-code-result'
import { execSync } from 'child_process'
import crypto from 'node:crypto'

interface UpdatePullRequestParams {
  organization: {
    id: number
    ext_gh_install_id: number
  }
  instructions: string
  pullRequestNumber: number
  repoOwner: string
  repoName: string
  answerID: string
}

export async function updatePullRequest(
  params: UpdatePullRequestParams
): Promise<{
  failed: boolean
  title?: string
  html_url?: string
  error?: string
}> {
  const {
    organization,
    instructions,
    pullRequestNumber,
    repoOwner,
    repoName,
    answerID,
  } = params

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const accessToken = await getGithubAccessToken({
    github,
  })

  const gitCloneUrl = `https://x-access-token:${accessToken}@github.com/${repoOwner}/${repoName}.git`

  // Generate unique code job id
  const id = crypto
    .createHash('sha1')
    .update(
      [
        new Date().valueOf(), // timestamp
        organization.id,
        instructions,
        pullRequestNumber,
      ].join(' ')
    )
    .digest('hex')
    .substring(0, 7) // get first 7 chars, same as git commits

  const directory = cloneRepository({
    organization,
    url: gitCloneUrl,
    dirName: id,
  })

  try {
    // Fetch the PR details
    const { data: pullRequest } = await github.rest.pulls.get({
      owner: repoOwner,
      repo: repoName,
      pull_number: pullRequestNumber,
    })

    // Checkout the PR branch
    execSync(`git fetch origin ${pullRequest.head.ref}`, { cwd: directory })
    execSync(`git checkout ${pullRequest.head.ref}`, { cwd: directory })

    // Generate and apply code changes
    const output = execSync(
      getWriteCodeCommand({
        instructions,
        context: null, // You might want to add context here if needed
        files: [], // You might want to specify files if needed
      }),
      {
        cwd: directory,
      }
    ).toString('utf-8')

    const result = await parseWriteCodeResult({ output })

    if (result.failed) {
      logger.debug('Failed to update PR', {
        event: 'update_pull_request:failed',
        answer_id: answerID,
        organization: getOrganizationLogData(organization),
        error: result.error,
      })

      return {
        failed: true,
        error: result.error,
      }
    }

    // Commit and push changes
    execSync('git add .', { cwd: directory })
    execSync(`git commit -m "Update PR: ${result.title}"`, { cwd: directory })
    execSync(`git push origin ${pullRequest.head.ref}`, { cwd: directory })

    // Update PR title and description
    await github.rest.pulls.update({
      owner: repoOwner,
      repo: repoName,
      pull_number: pullRequestNumber,
      title: result.title,
      body: result.description,
    })

    logger.debug('Successfully updated PR', {
      event: 'update_pull_request:success',
      answer_id: answerID,
      organization: getOrganizationLogData(organization),
      pr_title: result.title,
      pr_html_url: pullRequest.html_url,
    })

    return {
      failed: false,
      title: result.title,
      html_url: pullRequest.html_url,
    }
  } catch (error) {
    logger.debug('Failed to update PR', {
      event: 'update_pull_request:failed',
      answer_id: answerID,
      organization: getOrganizationLogData(organization),
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      failed: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  } finally {
    deleteRepository({ path: directory })
  }
}
