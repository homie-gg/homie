/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    { schema: 'homie', name: 'organization' },
    'is_over_plan_pr_limit',
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      is_over_plan_pr_limit: {
        type: 'boolean',
        default: false,
      },
    },
  )
}
