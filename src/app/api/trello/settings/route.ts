import { dbClient } from '@/database/client'
import { createRoute } from '@/lib/http/server/create-route'
import { registerTrelloBoardWebhook } from '@/lib/trello/register-trello-board-webhook'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const PATCH = createRoute(
  {
    body: z.object({
      ext_trello_board_id: z.string(),
      ext_trello_new_task_list_id: z.string(),
      ext_trello_done_task_list_id: z.string(),
    }),
  },
  async (req) => {
    const { body } = req

    const { userId } = auth()

    const organization = await dbClient
      .selectFrom('homie.organization')
      .where('ext_clerk_user_id', '=', userId)
      .select('id')
      .executeTakeFirstOrThrow()

    await registerTrelloBoardWebhook({
      organization,
      ext_trello_board_id: body.ext_trello_board_id,
    })

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
