import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import {
  BadRequestException,
  UnauthorizedException,
} from '@/lib/http/server/exceptions'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { AsanaWebhookEvent } from '@/lib/asana/types'

export const POST = createRoute(
  {
    body: z.object({
      events: z.array(z.any()).optional(),
    }),
    routeParams: z.object({
      project_id: z.string(),
    }),
  },
  async (request) => {
    const { routeParams } = request

    const project = await dbClient
      .selectFrom('asana.project')
      .where('asana.project.id', '=', parseInt(routeParams.project_id))
      .select(['asana.project.asana_webhook_secret', 'id'])
      .executeTakeFirstOrThrow()

    const secret = request.headers.get('X-Hook-Secret')

    // Initial request (handshake) confirming webhook sends
    // over a secret used to confirm subsequent requests
    // Reference: https://developers.asana.com/docs/webhooks-guide
    if (secret) {
      // Save secret on project
      await dbClient
        .updateTable('asana.project')
        .where('asana.project.id', '=', project.id)
        .set({
          asana_webhook_secret: secret,
        })
        .executeTakeFirstOrThrow()

      return NextResponse.json(
        {},
        {
          headers: {
            'X-Hook-Secret': secret,
          },
        },
      )
    }

    if (!project.asana_webhook_secret) {
      throw new BadRequestException({
        type: 'invalid_date',
        message: 'Missing asana secret; was it saved during inital handshake?',
      })
    }

    const signature = request.headers.get('X-Hook-Signature')

    const computedSignature = crypto
      .createHmac('SHA256', project.asana_webhook_secret)
      .update(JSON.stringify(request.body))
      .digest('hex')

    const isValidRequest = crypto.timingSafeEqual(
      Buffer.from(signature ?? ''),
      Buffer.from(computedSignature),
    )

    if (!isValidRequest) {
      throw new UnauthorizedException()
    }

    if (!request.body.events) {
      return NextResponse.json({})
    }

    await Promise.all(
      request.body.events.map(async (event: AsanaWebhookEvent) => {
        if (
          event.action === 'added' &&
          event.resource.resource_type === 'task'
        ) {
          console.log('ADDED TASK!')
        }

        if (
          event.action === 'changed' &&
          event.resource.resource_type === 'task' &&
          event.change.field === 'assignee' &&
          'user' in event
        ) {
          console.log('REMOVED ASSIGNMENT: ', event.user.gid)
        }

        if (
          event.action === 'changed' &&
          event.resource.resource_type === 'task' &&
          (event.change.field === 'name' || event.change.field === 'html_notes')
        ) {
          console.log('EDITED TASK')
        }

        if (
          event.action === 'added' &&
          event.resource.resource_type === 'story' &&
          event.resource.resource_subtype === 'assigned' &&
          event.parent.resource_type === 'task' &&
          'user' in event
        ) {
          console.log('ASSIGNED:', event.user.gid)
        }

        if (
          event.action === 'deleted' &&
          event.resource.resource_type === 'task'
        ) {
          console.log('DELETED: ', event.resource.gid)
        }
      }),
    )

    return NextResponse.json({})
  },
)
