import { dbClient } from '@/lib/db/client'
import { createRoute } from '@/lib/http/server/create-route'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const user = z.object({
  id: z.number(),
  created_at: z.string(),
  username: z.string(),
})

export type GithubUser = z.infer<typeof user>

export const GET = createRoute(
  {
    response: z.object({
      user,
    }),
    routeParams: z.object({
      id: z.string(),
    }),
  },
  async (request) => {
    const { routeParams } = request
    const user = await dbClient
      .selectFrom('github.user')
      .where('id', '=', parseInt(routeParams.id))
      .selectAll()
      .executeTakeFirstOrThrow()

    return NextResponse.json({
      user: {
        ...user,
        created_at: user.created_at.toISOString(),
      },
    })
  },
)
