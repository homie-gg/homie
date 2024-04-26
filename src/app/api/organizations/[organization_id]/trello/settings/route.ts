import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const PATCH = createRoute(
  {
    routeParams: z.object({ organization_id: z.string() }),
    body: z.object({
      ext_trello_board_id: z.string(),
      ext_trello_new_task_list_id: z.string(),
      ext_trello_done_task_list_id: z.string(),
    }),
  },
  async (req) => {
    const { body, routeParams } = req

    const { userId } = auth()

    const organization = await dbClient
      .selectFrom('voidpm.organization')
      .where('ext_clerk_user_id', '=', userId)
      .where('id', '=', parseInt(routeParams.organization_id))
      .select('id')
      .executeTakeFirstOrThrow()

    await dbClient
      .updateTable('trello.workspace')
      .set({
        ext_trello_board_id: body.ext_trello_board_id,
        ext_trello_new_task_list_id: body.ext_trello_new_task_list_id,
        ext_trello_done_task_list_id: body.ext_trello_done_task_list_id,
      })
      .where('organization_id', '=', organization.id)
      .executeTakeFirstOrThrow()

    return NextResponse.json({})
  },
)
