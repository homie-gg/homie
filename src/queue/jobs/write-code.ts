import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { getGithubAccessToken } from '@/lib/github/get-github-access-token'
import { writeCodeForGithub } from '@/lib/github/write-code-for-github'
import { logger } from '@/lib/log/logger'
import { escapeShellCommand } from '@/lib/shell/escape-shell-command'
import { createJob } from '@/queue/create-job'
import { execSync, spawnSync } from 'node:child_process'
import { comma } from 'postcss/lib/list'

export const writeCode = createJob({
  id: 'write_code',
  handle: async (
    payload:
      | {
          id: string
          organization_id: number
          instructions: string
          github_repo_id: number
          gitlab_project_id?: never
        }
      | {
          id: string
          organization_id: number
          instructions: string
          gitlab_project_id: number
          github_repo_id?: never
        },
  ) => {
    const { instructions, organization_id } = payload

    const organization = await dbClient
      .selectFrom('homie.organization')
      .leftJoin(
        'github.organization',
        'github.organization.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'gitlab.app_user',
        'gitlab.app_user.organization_id',
        'homie.organization.id',
      )
      .select(['homie.organization.id', 'ext_gh_install_id'])
      .where('homie.organization.id', '=', organization_id)
      .executeTakeFirst()

    if (!organization) {
      logger.debug('Missing organization', {
        event: 'write_code:missing_org',
      })
      return
    }

    if (payload.github_repo_id) {
      if (!organization.ext_gh_install_id) {
        logger.debug('Github not Installed', {
          event: 'write_code:github_not_installed',
        })

        return
      }

      await writeCodeForGithub({
        id: payload.id,
        instructions,
        githubRepoId: payload.github_repo_id,
        organization: {
          id: organization.id,
          ext_gh_install_id: organization.ext_gh_install_id,
        },
      })
    }

    // const branch = 'fixes'

    // const gitlabProject = await getGitlabProject({
    //   organizationId: organization.id,
    //   gitlabProjectId: payload.gitlab_project_id,
    // })

    // TODO
    // - update aider git to use Homie user (Homie bot@homie.gg)
    // - update clone to get repo dynamically
    // - Generate the instructions by:
    //   1. fetch relevant PRs
    //   2. send to LLM and ask LLM to generate a prompt
    // - Clean up /tmp dir after each PR
    // - Fetch default branch dynamically, and set in base

    // execSync(
    //   [
    //     'cd /tmp',
    //     'rm -rf foo',
    //     'mkdir foo',
    //     'cd foo',
    //     `git clone https://x-access-token:${accessToken}@github.com/mikewuu/homie-dev-mike.git`,
    //     'cd homie-dev-mike',
    //     command,
    //   ].join(' && '),
    //   {
    //     stdio: 'inherit', // output to console
    //   },
    // )

    // await github.rest.pulls.create({
    //   owner: 'mikewuu',
    //   repo: 'homie-dev-mike',
    //   title: 'First issue fix',
    //   body: 'This PR does something for your',
    //   base: 'main',
    //   head: branch,
    // })
  },
})

interface GetGitlabProjectParams {
  organizationId: number
  gitlabProjectId: number | undefined
}

async function getGitlabProject(params: GetGitlabProjectParams) {
  const { gitlabProjectId, organizationId } = params

  if (!gitlabProjectId) {
    return undefined
  }
  await dbClient
    .selectFrom('gitlab.project')
    .where('organization_id', '=', organizationId)
    .where('id', '=', gitlabProjectId)
    .executeTakeFirst()
}
