/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    {
      source_branch: {
        type: 'text',
        notNull: false,
      },
      target_branch: {
        type: 'text',
        notNull: false,
      },
      was_merged_to_default_branch: {
        type: 'boolean',
        default: false,
        notNull: true,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    ['source_branch', 'target_branch', 'was_merged_to_default_branch'],
  )
}
