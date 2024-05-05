import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const POST = createRoute(
  {
    routeParams: z.object({ organization_id: z.string() }),
    body: z.object({
      access_token: z.string(),
    }),
  },
  async (req) => {
    const {
      body: { access_token },
      routeParams,
    } = req

    const { userId } = auth()

    const organization = await dbClient
      .selectFrom('homie.organization')
      .where('ext_clerk_user_id', '=', userId)
      .where('id', '=', parseInt(routeParams.organization_id))
      .select('id')
      .executeTakeFirstOrThrow()

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
