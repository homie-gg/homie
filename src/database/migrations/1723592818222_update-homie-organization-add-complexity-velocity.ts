/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      complexity_score_per_day: {
        type: 'integer',
        notNull: false,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(
    {
      schema: 'homie',
      name: 'organization',
    },
    ['complexity_score_per_day'],
  )
}
