import { dbClient } from '@/database/client'
import { getWriteCodeCommand } from '@/lib/ai/get-write-code-command'
import { parseWriteCodeResult } from '@/lib/ai/parse-write-code-result'
import { generateMRSummary } from '@/lib/ai/generate-mr-summary'
import { cloneRepository } from '@/lib/git/clone-repository'
import { deleteRepository } from '@/lib/git/delete-repository'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { getGitlabDefaultBranch } from '@/lib/gitlab/get-default-branch'
import { getGitlabAccessToken } from '@/lib/gitlab/get-gitlab-access-token'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { execSync } from 'child_process'

interface WriteCodeForGitlabParams {
  id: string
  instructions: string
  gitlabProjectID: number
  organization: {
    id: number
    ext_gl_install_id: number
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
      web_url: string
    }

export async function writeCodeForGitlab(
  params: WriteCodeForGitlabParams,
): Promise<WriteCodeResult> {
  const {
    id,
    instructions,
    gitlabProjectID,
    answerID,
    organization,
    files,
    context,
  } = params

  const gitlab = await createGitlabClient({
    installationId: organization.ext_gl_install_id,
  })

  const accessToken = await getGitlabAccessToken({
    gitlab,
  })

  const project = await dbClient
    .selectFrom('gitlab.project')
    .where('organization_id', '=', organization.id)
    .where('id', '=', gitlabProjectID)
    .select(['path_with_namespace', 'id'])
    .executeTakeFirst()

  if (!project) {
    throw new Error('Missing project info')
  }

  const gitCloneUrl = `https://oauth2:${accessToken}@gitlab.com/${project.path_with_namespace}.git`

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

    const defaultBranch = await getGitlabDefaultBranch({
      gitlab,
      projectId: project.id,
    })

    // Open MR
    const mr = await gitlab.MergeRequests.create(
      project.id,
      branch,
      defaultBranch,
      result.title,
      {
        description: result.description,
      }
    )

    // Generate and add summary comment
    const summary = await generateMRSummary(mr)
    await gitlab.MergeRequestNotes.create(
      project.id,
      mr.iid,
      `## Homie Summary\n\n${summary}`
    )

    deleteRepository({ path: directory })

    logger.debug('Successfully wrote code, opened MR & added summary comment', {
      event: 'write_code:success',
      answer_id: answerID,
      organization: getOrganizationLogData(organization),
      mr_title: mr.title,
      mr_web_url: mr.web_url,
    })

    return {
      failed: false,
      title: mr.title,
      web_url: mr.web_url,
    }
  } catch (error) {
    deleteRepository({ path: directory })

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
