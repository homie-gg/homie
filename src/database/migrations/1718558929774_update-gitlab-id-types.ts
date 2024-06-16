/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(
    {
      schema: 'gitlab',
      name: 'project',
    },
    'ext_gitlab_project_id',
    {
      type: 'bigint',
      notNull: true,
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(
    {
      schema: 'gitlab',
      name: 'project',
    },
    'ext_gitlab_project_id',
    {
      type: 'integer',
      notNull: true,
    },
  )
}
