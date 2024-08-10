/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    {
      schema: 'homie',
      name: 'duplicate_task_notification',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      target_task_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'task',
        },
      },
      duplicate_task_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'task',
        },
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  return pgm.dropTable('homie.duplicate_task_notification')
}
