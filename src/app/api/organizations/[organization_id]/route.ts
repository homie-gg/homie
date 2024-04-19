import {
  organizationData,
  organizationResponse,
} from '@/app/api/organizations/[organization_id]/types'
import { dbClient } from '@/lib/db/client'
import { createRoute } from '@/lib/http/server/create-route'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const PATCH = createRoute(
  {
    routeParams: z.object({ organization_id: z.string() }),
    body: organizationData.partial(),
    response: z.object({
      organization: organizationResponse,
    }),
  },
  async (request) => {
    const { userId } = auth()

    const organization = await dbClient
      .updateTable('voidpm.organization')
      .where('ext_clerk_user_id', '=', userId)
      .where('id', '=', parseInt(request.routeParams.organization_id))
      .set(request.body)
      .returningAll()
      .executeTakeFirstOrThrow()

    return NextResponse.json({
      organization: {
        ...organization,
        created_at: organization.created_at.toISOString(),
        updated_at: organization.updated_at.toISOString(),
      },
    })
  },
)
