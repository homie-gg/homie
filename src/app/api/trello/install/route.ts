import { dbClient } from '@/database/client'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { createRoute } from '@/lib/http/server/create-route'
import { NotFoundException } from '@/lib/http/server/exceptions'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const POST = createRoute(
  {
    body: z.object({
      access_token: z.string(),
    }),
  },
  async (req) => {
    const {
      body: { access_token },
    } = req
    const organization = await getUserOrganization()

    if (!organization) {
      throw new NotFoundException({
        message: 'Failed to install Trello app; missing organization',
        type: 'trello_install.failed',
      })
    }

    await dbClient
      .insertInto('trello.workspace')
      .values({
        trello_access_token: access_token,
        organization_id: organization.id,
      })
      .onConflict((oc) =>
        oc.column('organization_id').doUpdateSet({
          trello_access_token: access_token,
          organization_id: organization.id,
        }),
      )
      .executeTakeFirstOrThrow()

    return NextResponse.json({})
  },
)
