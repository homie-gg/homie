import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
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
          organization_id: number
          instructions: string
          github_repo_id: number
          gitlab_project_id?: never
        }
      | {
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

    if (!organization.ext_gh_install_id) {
      return
    }

    const github = await createGithubClient({
      installationId: organization.ext_gh_install_id,
    })

    const { token } = (await github.auth({ type: 'installation' })) as any
    const command = `aider --yes --message ${escapeShellCommand({
      command: instructions,
    })} "/app/src\/app\/\(user\)\/_components\/NavBar.module.scss"`

    const branch = 'fixes'

    execSync(
      [
        'cd /tmp',
        'rm -rf foo',
        'mkdir foo',
        'cd foo',
        `git clone https://x-access-token:${token}@github.com/nextastic/nextastic.git`,
        // `git checkout -b ${branch}`,
        // `git push -f origin ${branch}`,
      ].join(' && '),
      {
        stdio: 'inherit', // output to console
      },
    )

    spawnSync(
      [
        'whoami',
        'git checkout main',
        // command,
        // `git checkout -b ${branch}`,
        // `git push -f origin ${branch}`,
      ].join(' && '),
      {
        cwd: '/tmp/foo/nextastic',
        stdio: 'inherit', // output to console
        env: process.env,
      },
    )

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
