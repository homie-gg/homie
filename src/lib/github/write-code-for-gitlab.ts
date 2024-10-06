import { dbClient } from '@/database/client'
import { getWriteCodeCommand } from '@/lib/ai/get-write-code-command'
import { parseWriteCodeResult } from '@/lib/ai/parse-write-code-result'
import { cloneRepository } from '@/lib/git/clone-repository'
import { deleteRepository } from '@/lib/git/delete-repository'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { execSync } from 'child_process'

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
  const { id, instructions, gitlabProjectId, organization, files, context } =
    params

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  const project = await dbClient
    .selectFrom('gitlab.project')
    .where('organization_id', '=', organization.id)
    .where('id', '=', gitlabProjectId)
    .select(['name', 'ext_gitlab_project_id'])
    .executeTakeFirst()

  if (!project) {
    throw new Error('Missing repo info')
  }

  const gitCloneUrl = `https://oauth2:${organization.gitlab_access_token}@gitlab.com/${project.name.replaceAll(' ', '')}.git`

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

    if (result.failed) {
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

    const projectInfo = await gitlab.Projects.show(
      project.ext_gitlab_project_id,
      {
        showExpanded: true,
      },
    )
    const defaultBranch = projectInfo.data.default_branch

    // Open PR

    const res = await gitlab.MergeRequests.create(
      project.ext_gitlab_project_id,
      branch,
      defaultBranch,
      result.title,
      {
        description: result.description,
      },
    )

    deleteRepository({ path: directory })

    return {
      failed: false,
      title: res.title,
      html_url: res.web_url,
    }
  } catch (error) {
    deleteRepository({ path: directory })
    throw error
  }
}
