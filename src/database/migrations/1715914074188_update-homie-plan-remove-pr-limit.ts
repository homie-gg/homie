/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn({ schema: 'homie', name: 'plan' }, 'pr_limit_per_month')
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    {
      schema: 'homie',
      name: 'plan',
    },
    {
      pr_limit_per_month: {
        type: 'integer',
        default: 0,
        notNull: false,
      },
    },
  )
}
