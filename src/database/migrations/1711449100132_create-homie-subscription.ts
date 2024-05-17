/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    { schema: 'homie', name: 'subscription' },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      name: { type: 'text', notNull: true },
      ext_stripe_subscription_id: { type: 'text', notNull: true },
      stripe_status: { type: 'text', notNull: true },
      trial_ends_at: { type: 'timestamptz', notNull: false },
      ends_at: { type: 'timestamptz', notNull: false },

      plan_id: {
        type: 'integer',
        unique: false,
        notNull: true,
        references: {
          schema: 'homie',
          name: 'plan',
        },
      },
      organization_id: {
        type: 'integer',
        unique: true,
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
  pgm.dropTable('homie.subscription')
}
