/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    {
      schema: 'github',
      name: 'organization',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      ext_gh_install_id: { type: 'integer', notNull: true, unique: true },
      organization_id: {
        type: 'integer',
        notNull: true,
        unique: true,
        references: {
          schema: 'homie',
          name: 'organization',
        },
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('github.organization')
}
