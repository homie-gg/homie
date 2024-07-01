import { dbClient } from '@/database/client'
import { registerGitlabWebhooks } from '@/lib/gitlab/register-gitlab-webhooks'
import { removeGitlabWebhooks } from '@/lib/gitlab/remove-gitlab-webhooks'
import { createRoute } from '@/lib/http/server/create-route'
import {
  NotFoundException,
  UnauthorizedException,
} from '@/lib/http/server/exceptions'
import { dispatch } from '@/queue/default-queue'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const PATCH = createRoute(
  {
    routeParams: z.object({
      project_id: z.string(),
    }),
    body: z.object({
      enabled: z.boolean(),
    }),
  },
  async (request) => {
    const { routeParams, body } = request

    const { userId } = auth()

    if (!userId) {
      throw new UnauthorizedException()
    }

    const organization = await dbClient
      .selectFrom('homie.organization')
      .innerJoin(
        'gitlab.app_user',
        'gitlab.app_user.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'trello.workspace',
        'trello.workspace.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'asana.app_user',
        'asana.app_user.organization_id',
        'homie.organization.id',
      )
      .where('ext_clerk_user_id', '=', userId)
      .select([
        'homie.organization.id',
        'gitlab.app_user.gitlab_access_token',
        'gitlab.app_user.gitlab_webhook_secret',
        'trello.workspace.trello_access_token',
        'asana_access_token',
        'homie.organization.has_unlimited_usage',
      ])
      .executeTakeFirst()

    if (!organization) {
      throw new NotFoundException({
        type: 'missing_organization',
        message: 'Organization not found; was setup completed successfully?',
      })
    }

    await dbClient.transaction().execute(async (trx) => {
      const project = await trx
        .updateTable('gitlab.project')
        .set({
          enabled: body.enabled,
        })
        .where('gitlab.project.id', '=', parseInt(routeParams.project_id))
        .where('organization_id', '=', organization.id)
        .returning([
          'id',
          'enabled',
          'gitlab.project.name',
          'has_completed_setup',
          'ext_gitlab_project_id',
        ])
        .executeTakeFirstOrThrow()

      if (project.enabled && !project.has_completed_setup) {
        await dispatch('import_gitlab_merge_requests', {
          organization,
          project,
        })

        await trx
          .updateTable('gitlab.project')
          .set({
            has_completed_setup: true,
          })
          .where('id', '=', project.id)
          .executeTakeFirstOrThrow()
      }

      if (project.enabled) {
        await registerGitlabWebhooks({
          gitlabAppUser: {
            gitlab_access_token: organization.gitlab_access_token,
            gitlab_webhook_secret: organization.gitlab_webhook_secret,
          },
          project,
        })
      } else {
        await removeGitlabWebhooks({
          project,
          gitlabAppUser: {
            gitlab_access_token: organization.gitlab_access_token,
          },
        })
      }
    })

    return NextResponse.json({})
  },
)
