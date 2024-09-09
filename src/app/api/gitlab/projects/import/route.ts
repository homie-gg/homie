import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import {
  NotFoundException,
  UnauthorizedException,
} from '@/lib/http/server/exceptions'
import { importGitlabProjects } from '@/queue/jobs/import-gitlab-projects'
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
      'gitlab.app_user',
      'gitlab.app_user.organization_id',
      'homie.organization.id',
    )
    .where('ext_clerk_user_id', '=', userId)
    .select([
      'homie.organization.id',
      'gitlab.app_user.gitlab_access_token',
      'gitlab.app_user.gitlab_webhook_secret',
    ])
    .executeTakeFirst()

  if (!organization) {
    throw new NotFoundException({
      type: 'missing_organization',
      message: 'Organization not found; was setup completed successfully?',
    })
  }

  await importGitlabProjects.dispatch({
    organization: {
      id: organization.id,
      gitlab_access_token: organization.gitlab_access_token,
      gitlab_webhook_secret: organization.gitlab_webhook_secret,
    },
  })

  return NextResponse.json({})
})
