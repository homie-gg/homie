/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    {
      schema: 'gitlab',
      name: 'app_user',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      gitlab_access_token: { type: 'text', notNull: true },
      gitlab_refresh_token: { type: 'text', notNull: true },
      gitlab_webhook_secret: { type: 'text', notNull: true },
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
  pgm.dropTable('gitlab.app_user')
}
