/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    {
      schema: 'asana',
      name: 'project',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      name: { type: 'text', notNull: true },
      ext_asana_project_id: { type: 'string', notNull: true, unique: true },
      ext_asana_webhook_id: { type: 'string', notNull: false, unique: true },
      asana_webhook_secret: { type: 'text', notNull: false },
      has_completed_setup: {
        type: 'boolean',
        default: false,
        notNull: true,
      },
      enabled: {
        type: 'boolean',
        default: false,
        notNull: true,
      },
      organization_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'organization',
        },
        onDelete: 'CASCADE',
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('asana.project')
}
