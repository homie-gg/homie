/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint(
    {
      schema: 'homie',
      name: 'plan',
    },
    'plan_name_billing_interval',
    'UNIQUE(name, billing_interval)',
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    {
      schema: 'homie',
      name: 'plan',
    },
    'plan_name_billing_interval',
  )
}
