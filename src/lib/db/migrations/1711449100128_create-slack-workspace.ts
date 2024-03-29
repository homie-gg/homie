/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    { schema: 'slack', name: 'workspace' },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      ext_slack_team_id: { type: 'text', notNull: true, unique: true },
      webhook_url: { type: 'text', notNull: true },
      ext_slack_webhook_channel_id: { type: 'text', notNull: true },
      slack_access_token: { type: 'text', notNull: true },
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
  pgm.dropTable('slack.workspace')
}
