import { dbClient } from '@/database/client'
import { getWriteCodeCommand } from '@/lib/ai/get-write-code-command'
import { parseWriteCodeResult } from '@/lib/ai/parse-write-code-result'
import { generatePRSummary } from '@/lib/ai/generate-pr-summary'
import { cloneRepository } from '@/lib/git/clone-repository'
import { deleteRepository } from '@/lib/git/delete-repository'
import { createGithubClient } from '@/lib/github/create-github-client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { execSync } from 'child_process'

interface WriteCodeForGithubParams {
  id: string
  instructions: string
  githubRepoID: number
  organization: {
    id: number
    ext_gh_install_id: number
  }
  files: string[]
  context: string | null
  answerID: string
}

type WriteCodeResult =
  | {
      failed: true
      error: string
    }
  | {
      failed: false
      title: string
      html_url: string
    }

export async function writeCodeForGithub(
  params: WriteCodeForGithubParams,
): Promise<WriteCodeResult> {
  const {
    id,
    instructions,
    githubRepoID,
    organization,
    files,
    context,
    answerID,
  } = params

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const repo = await dbClient
    .selectFrom('github.repository')
    .where('organization_id', '=', organization.id)
    .where('id', '=', githubRepoID)
    .select(['name', 'ext_gh_repo_id', 'full_name'])
    .executeTakeFirst()

  if (!repo) {
    throw new Error('Missing repo info')
  }

  const directory = cloneRepository({
    organization,
    url: `https://x-access-token:${github.auth.token}@github.com/${repo.full_name}.git`,
    dirName: id,
  })

  try {
    const output = execSync(
      getWriteCodeCommand({
        instructions,
        context,
        files,
      }),
      {
        cwd: directory,
      },
    ).toString('utf-8')

    const result = await parseWriteCodeResult({ output })

    logger.debug('Got write code result', {
      event: 'write_code:result',
      answer_id: answerID,
      organization: getOrganizationLogData(organization),
      result,
    })

    if (result.failed) {
      logger.debug('Failed to write code', {
        event: 'write_code:failed',
        answer_id: answerID,
        organization: getOrganizationLogData(organization),
        error: result.error,
      })

      return {
        failed: true,
        error: result.error,
      }
    }

    const branch = `homie-${id}`

    try {
      execSync(`git branch -D ${branch}`, { cwd: directory, stdio: 'ignore' })
    } catch {
      // ignore errors
    }

    try {
      execSync(`git checkout -b ${branch}`, { cwd: directory })
    } catch {
      // ignore erorrs
    }

    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: directory,
    })
      .toString()
      .trim()

    if (currentBranch !== branch) {
      throw new Error(`Could not checkout git branch: ${branch}`)
    }

    // Push the branch to remote
    execSync(`git push origin ${branch}`, {
      cwd: directory,
    })

    // Open PR
    const res = await github.rest.pulls.create({
      owner: repo.full_name.split('/')[0],
      repo: repo.name,
      title: result.title,
      head: branch,
      base: 'main',
      body: result.description,
    })

    // Generate and add summary comment
    const summary = await generatePRSummary(res.data)
    await github.rest.issues.createComment({
      owner: repo.full_name.split('/')[0],
      repo: repo.name,
      issue_number: res.data.number,
      body: `## Homie Summary\n\n${summary}`,
    })

    deleteRepository({ path: directory })

    logger.debug('Successfully wrote code, opened PR & added summary comment', {
      event: 'write_code:success',
      answer_id: answerID,
      organization: getOrganizationLogData(organization),
      pr_title: res.data.title,
      pr_html_url: res.data.html_url,
    })

    return {
      failed: false,
      title: res.data.title,
      html_url: res.data.html_url,
    }
  } catch (error) {
    logger.debug('Failed to write code', {
      event: 'write_code:failed',
      answer_id: answerID,
      organization: getOrganizationLogData(organization),
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      failed: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
