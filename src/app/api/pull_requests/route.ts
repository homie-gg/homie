import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import { NotFoundException } from '@/lib/http/server/exceptions'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const pullRequest = z.object({
  id: z.number(),
  created_at: z.string(),
  merged_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  title: z.string(),
  contributor_id: z.number(),
})

export type GithubPullRequest = z.infer<typeof pullRequest>

export const GET = createRoute(
  {
    query: z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }),
    response: z.object({
      pull_requests: z.array(pullRequest),
    }),
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

    const { query } = request
    const pullRequests = await dbClient
      .selectFrom('voidpm.pull_request')
      .where('created_at', '>=', new Date(query.from))
      .where('created_at', '<=', new Date(query.to))
      .where('voidpm.pull_request.organization_id', '=', organization.id)
      .selectAll()
      .execute()

    return NextResponse.json({
      pull_requests: pullRequests.map((pullRequest) => ({
        ...pullRequest,
        created_at: pullRequest.created_at.toISOString(),
        merged_at: pullRequest.merged_at?.toISOString() ?? null,
        closed_at: pullRequest.closed_at?.toISOString() ?? null,
      })),
    })
  },
)
