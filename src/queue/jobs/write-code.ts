import { dbClient } from '@/database/client'
import { writeCodeForGithub } from '@/lib/github/write-code-for-github'
import { logger } from '@/lib/log/logger'
import { createJob } from '@/queue/create-job'
import crypto from 'node:crypto'

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
    context,
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

    // Generate unique code job id
    const id = crypto
      .createHash('sha1')
      .update(
        [
          new Date().valueOf(), // timestamp
          context.id ?? '', // job id
          organization.id,
          instructions,
        ].join(' '),
      )
      .digest('hex')
      .substring(0, 7) // get first 7 chars, same as git commits

    if (payload.github_repo_id) {
      if (!organization.ext_gh_install_id) {
        logger.debug('Github not Installed', {
          event: 'write_code:github_not_installed',
        })

        return
      }

      await writeCodeForGithub({
        id,
        instructions,
        githubRepoId: payload.github_repo_id,
        organization: {
          id: organization.id,
          ext_gh_install_id: organization.ext_gh_install_id,
        },
      })
    }
  },
})
