/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    {
      schema: 'trello',
      name: 'workspace',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      trello_access_token: { type: 'text', notNull: true },
      ext_trello_board_id: { type: 'text', notNull: false },
      ext_trello_new_task_list_id: { type: 'text', notNull: false },
      ext_trello_done_task_list_id: { type: 'text', notNull: false },
      organization_id: {
        type: 'integer',
        unique: true,
        notNull: true,
        references: {
          schema: 'voidpm',
          name: 'organization',
        },
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('trello.workspace')
}
