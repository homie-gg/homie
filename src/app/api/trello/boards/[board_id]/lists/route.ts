import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import { BadRequestException } from '@/lib/http/server/exceptions'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { TrelloList } from '@/lib/trello/types'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const trelloList = z.object({
  id: z.string(),
  name: z.string(),
})

export const GET = createRoute(
  {
    routeParams: z.object({
      board_id: z.string(),
    }),
    response: z.object({
      lists: z.array(trelloList),
    }),
  },
  async (req) => {
    const { routeParams } = req

    const { userId } = auth()

    const organization = await dbClient
      .selectFrom('voidpm.organization')
      .where('ext_clerk_user_id', '=', userId)
      .leftJoin(
        'trello.workspace',
        'trello.workspace.organization_id',
        'voidpm.organization.id',
      )
      .select(['voidpm.organization.id', 'trello_access_token'])
      .executeTakeFirstOrThrow()

    if (!organization.trello_access_token) {
      throw new BadRequestException({
        type: 'missing_access_token',
        message: 'Missing Trello access token',
      })
    }

    const trelloClient = createTrelloClient(organization.trello_access_token)
    const lists = await trelloClient.get<TrelloList[]>(
      `/boards/${routeParams.board_id}/lists`,
    )

    return NextResponse.json({
      lists,
    })
  },
)
