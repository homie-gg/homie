/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    { schema: 'pami', name: 'organization' },
    {
      organization_id: 'primary_uuid',
      created_at: 'created_or_updated_at',
      updated_at: 'created_or_updated_at',
      ext_gh_install_id: { type: 'text', notNull: true, unique: true },
      ext_clerk_user_id: { type: 'text', unique: true, notNull: true },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('organization')
}
