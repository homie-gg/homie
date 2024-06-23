/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    {
      schema: 'homie',
      name: 'task',
    },
    'is_assigned',
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    {
      schema: 'homie',
      name: 'task',
    },
    {
      is_assigned: {
        type: 'boolean',
        default: false,
        notNull: true,
      },
    },
  )
}
