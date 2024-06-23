/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(
    {
      schema: 'homie',
      name: 'contributor',
    },
    {
      ext_asana_user_id: {
        type: 'text',
        unique: true,
        notNull: false,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    {
      schema: 'homie',
      name: 'contributor',
    },
    'ext_asana_user_id',
  )
}
