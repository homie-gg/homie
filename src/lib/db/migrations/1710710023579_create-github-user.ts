/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    {
      schema: 'github',
      name: 'user',
    },
    {
      user_id: 'primary_uuid',
      ext_gh_user_id: { type: 'text', unique: true, notNull: true },
      organization_id: {
        type: 'uuid',
        notNull: true,
        references: {
          schema: 'pami',
          name: 'organization',
        },
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('github.user')
}
