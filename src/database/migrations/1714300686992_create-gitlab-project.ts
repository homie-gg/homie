/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    {
      schema: 'gitlab',
      name: 'project',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      name: { type: 'text', notNull: true },
      web_url: { type: 'text', notNull: true },
      ext_gitlab_project_id: { type: 'integer', notNull: true, unique: true },
      enabled: {
        type: 'boolean',
        default: false,
        notNull: true,
      },
      has_completed_setup: {
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
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('gitlab.project')
}
