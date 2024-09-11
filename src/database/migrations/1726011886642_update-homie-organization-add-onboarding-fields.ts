/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      owner_name: {
        type: 'text',
        notNull: false,
      },
      team_size: {
        type: 'text',
        notNull: false,
      },
      target_features: {
        type: 'text',
        notNull: false,
      },
      referral_source: {
        type: 'text',
        notNull: false,
      },
      homie_expectation: {
        type: 'text',
        notNull: false,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('homie.organization', ['owner_name'])
}
