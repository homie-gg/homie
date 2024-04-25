/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    { schema: 'voidpm', name: 'plan' },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      name: { type: 'text', notNull: true },
      billing_interval: { type: 'text', notNull: true },
      ext_stripe_price_id: { type: 'text', notNull: true },
      pr_limit_per_month: { type: 'integer', notNull: false },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('voidpm.plan')
}
