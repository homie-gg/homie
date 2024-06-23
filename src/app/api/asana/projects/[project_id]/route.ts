import { dbClient } from '@/database/client'
import { registerAsanaProjectWebhook } from '@/lib/asana/register-asana-project-webhook'
import { removeAsanaProjectWebhook } from '@/lib/asana/remove-asana-project-webhook'
import { createRoute } from '@/lib/http/server/create-route'
import {
  BadRequestException,
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
        'asana.app_user',
        'asana.app_user.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'trello.workspace',
        'trello.workspace.organization_id',
        'homie.organization.id',
      )
      .where('ext_clerk_user_id', '=', userId)
      .select([
        'homie.organization.id',
        'asana.app_user.asana_access_token',
        'trello.workspace.trello_access_token',
      ])
      .executeTakeFirst()

    if (!organization) {
      throw new NotFoundException({
        type: 'missing_organization',
        message: 'Organization not found; was setup completed successfully?',
      })
    }

    const project = await dbClient
      .updateTable('asana.project')
      .set({
        enabled: body.enabled,
      })
      .where('asana.project.id', '=', parseInt(routeParams.project_id))
      .where('organization_id', '=', organization.id)
      .returning([
        'id',
        'enabled',
        'asana.project.name',
        'has_completed_setup',
        'ext_asana_project_id',
        'ext_asana_webhook_id',
      ])
      .executeTakeFirstOrThrow()

    if (project.enabled && !project.has_completed_setup) {
      await dispatch('import_asana_tasks', {
        organization,
        project,
      })

      await dbClient
        .updateTable('asana.project')
        .set({
          has_completed_setup: true,
        })
        .where('id', '=', project.id)
        .executeTakeFirstOrThrow()
    }

    if (!project.enabled) {
      await removeAsanaProjectWebhook({
        project,
        asanaAppUser: {
          asana_access_token: organization.asana_access_token,
        },
      })
      return NextResponse.json({})
    }

    const webhook = await registerAsanaProjectWebhook({
      asanaAppUser: {
        asana_access_token: organization.asana_access_token,
      },
      project,
    })

    if (!webhook.active) {
      throw new BadRequestException({
        type: 'server_error',
        message: `Failed to register Asana webhook for project: ${project.ext_asana_project_id}`,
      })
    }

    await dbClient
      .updateTable('asana.project')
      .set({
        ext_asana_webhook_id: webhook.gid,
      })
      .where('id', '=', project.id)
      .executeTakeFirstOrThrow()

    return NextResponse.json({})
  },
)
