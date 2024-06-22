import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import {
  NotFoundException,
  UnauthorizedException,
} from '@/lib/http/server/exceptions'
import { dispatch } from '@/queue/default-queue'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export const POST = createRoute({}, async () => {
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
    .where('ext_clerk_user_id', '=', userId)
    .select(['homie.organization.id', 'asana.app_user.asana_access_token'])
    .executeTakeFirst()

  if (!organization) {
    throw new NotFoundException({
      type: 'missing_organization',
      message: 'Organization not found; was setup completed successfully?',
    })
  }

  await dispatch('import_asana_projects', {
    organization: {
      id: organization.id,
      asana_access_token: organization.asana_access_token,
    },
  })

  return NextResponse.json({})
})