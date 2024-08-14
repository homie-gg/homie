/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(
    {
      schema: 'homie',
      name: 'task',
    },
    {
      complexity_score: {
        type: 'integer',
        notNull: true,
        default: 0,
      },
      estimated_days_to_complete: {
        type: 'integer',
        notNull: false,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    {
      schema: 'homie',
      name: 'task',
    },
    ['complexity_score', 'estimated_days_to_complete'],
  )
}
