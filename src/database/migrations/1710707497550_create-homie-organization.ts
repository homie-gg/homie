/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    { schema: 'homie', name: 'organization' },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      ext_clerk_user_id: { type: 'text', unique: true, notNull: true },
      ext_stripe_customer_id: { type: 'text', unique: true, notNull: false },
      is_over_plan_pr_limit: { type: 'boolean', default: false },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('organization')
}
