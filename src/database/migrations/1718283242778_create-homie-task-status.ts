/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    { schema: 'homie', name: 'task_status' },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      name: { type: 'text', notNull: true },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  return pgm.dropTable('homie.task_status')
}
