import { dbClient } from '@/database/client'
import { getWriteCodeCommand } from '@/lib/ai/get-write-code-command'
import { parseWriteCodeResult } from '@/lib/ai/parse-write-code-result'
import { cloneRepository } from '@/lib/git/clone-repository'
import { deleteRepository } from '@/lib/git/delete-repository'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { execSync } from 'child_process'
import { generatePRSummary } from '@/lib/ai/generate-pr-summary'

interface WriteCodeForGithubParams {
  id: string
  instructions: string
  gitlabProjectId: number
  organization: {
    id: number
    gitlab_access_token: string
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

export async function writeCodeForGitlab(
  params: WriteCodeForGithubParams,
): Promise<WriteCodeResult> {
  const {
    id,
    instructions,
    gitlabProjectId,
    organization,
    files,
    context,
    answerID,
  } = params

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  const project = await dbClient
    .selectFrom('gitlab.project')
    .where('organization_id', '=', organization.id)
    .where('id', '=', gitlabProjectId)
    .select(['name', 'ext_gitlab_project_id', 'web_url'])
    .executeTakeFirst()

  if (!project) {
    throw new Error('Missing repo info')
  }

  const gitCloneUrl = `https://oauth2:${organization.gitlab_access_token}@${project.web_url.replace('https://', '')}.git`

  const directory = cloneRepository({
    organization,
    url: gitCloneUrl,
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
      // ignore errors
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

    const projectInfo = await gitlab.Projects.show(
      project.ext_gitlab_project_id,
      {
        showExpanded: true,
      },
    )
    const defaultBranch = projectInfo.data.default_branch

    // Generate summary
    const changes = execSync('git diff --stat', { cwd: directory }).toString('utf-8')
    const summary = await generatePRSummary(result.title, result.description, changes)

    // Open PR with summary in description
    const res = await gitlab.MergeRequests.create(
      project.ext_gitlab_project_id,
      branch,
      defaultBranch,
      result.title,
      {
        description: `${result.description}\n\n## Homie Summary\n\n${summary}`,
      },
    )

    deleteRepository({ path: directory })

    logger.debug('Successfully wrote code & opened PR', {
      event: 'write_code:success',
      answer_id: answerID,
      organization: getOrganizationLogData(organization),
      pr_title: res.title,
      pr_html_url: res.web_url,
    })

    return {
      failed: false,
      title: res.title,
      html_url: res.web_url,
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
