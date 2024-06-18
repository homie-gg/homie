/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    {
      schema: 'homie',
      name: 'task',
    },
    'task_ext_gh_issue_number_key',
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint(
    {
      schema: 'homie',
      name: 'task',
    },
    'task_ext_gh_issue_number_key',
    'UNIQUE(ext_gh_issue_number)',
  )
}
