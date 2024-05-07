import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import { NotFoundException } from '@/lib/http/server/exceptions'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const contributor = z.object({
  id: z.number(),
  created_at: z.string(),
  ext_gh_user_id: z.number().nullable(),
  username: z.string(),
  organization_id: z.number(),
  ext_slack_member_id: z.string().nullable(),
})

export const PATCH = createRoute(
  {
    routeParams: z.object({ contributor_id: z.string() }),
    body: z.object({
      ext_slack_member_id: z.string(),
    }),
    response: z.object({ contributor }),
  },
  async (request) => {
    const organization = await getUserOrganization()

    if (!organization) {
      throw new NotFoundException({
        type: 'missing_organization',
        message:
          'Organization not found; did the Github app install successfully?',
      })
    }

    const contributor = await dbClient
      .updateTable('homie.contributor')
      .set({
        ext_slack_member_id: request.body.ext_slack_member_id,
      })
      .where('organization_id', '=', organization?.id)
      .where('id', '=', parseInt(request.routeParams.contributor_id))
      .returningAll()
      .executeTakeFirstOrThrow()

    return NextResponse.json({
      contributor: {
        ...contributor,
        created_at: contributor.created_at.toISOString(),
        updated_at: contributor.updated_at.toISOString(),
      },
    })
  },
)
