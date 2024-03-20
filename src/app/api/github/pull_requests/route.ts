import { dbClient } from '@/lib/db/client'
import { createRoute } from '@/lib/http/server/create-route'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const pullRequest = z.object({
  id: z.number(),
  created_at: z.string(),
  merged_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  user_id: z.number(),
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
    const { query } = request
    const pullRequests = await dbClient
      .selectFrom('github.pull_request')
      .where('created_at', '>=', new Date(query.from))
      .where('created_at', '<=', new Date(query.to))
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
