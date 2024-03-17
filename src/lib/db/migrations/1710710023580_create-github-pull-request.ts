/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    {
      schema: 'github',
      name: 'pull_request',
    },
    {
      pull_request_id: 'primary_uuid',
      ext_gh_pull_request_id: { type: 'text', unique: true, notNull: true },
      organization_id: {
        type: 'uuid',
        notNull: true,
        references: {
          schema: 'pami',
          name: 'organization',
        },
      },
      user_id: {
        type: 'uuid',
        notNull: true,
        references: {
          schema: 'github',
          name: 'user',
        },
      },
      title: { type: 'text', notNull: true },
      html_url: { type: 'text', notNull: true },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('github.user')
}
