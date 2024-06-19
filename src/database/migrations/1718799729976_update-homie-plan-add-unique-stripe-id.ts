/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint(
    {
      schema: 'homie',
      name: 'plan',
    },
    'plan_ext_stripe_price_id_key',
    'UNIQUE(ext_stripe_price_id)',
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    {
      schema: 'homie',
      name: 'plan',
    },
    'plan_ext_stripe_price_id_key',
  )
}
