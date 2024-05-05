/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    {
      schema: 'homie',
      name: 'contributor',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      ext_gh_user_id: { type: 'integer', unique: true, notNull: true },
      username: { type: 'text', notNull: true },
      organization_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'organization',
        },
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('homie.contributor')
}
