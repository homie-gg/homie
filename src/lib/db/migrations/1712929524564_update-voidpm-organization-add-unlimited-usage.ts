/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    {
      schema: 'voidpm',
      name: 'organization',
    },
    {
      has_unlimited_usage: {
        type: 'boolean',
        default: false,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    {
      schema: 'voidpm',
      name: 'organization',
    },
    'has_unlimited_usage',
  )
}
