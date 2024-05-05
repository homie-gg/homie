/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    {
      schema: 'homie',
      name: 'contributor',
    },
    {
      ext_slack_member_id: {
        type: 'string',
        notNull: false,
        default: null,
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
    'ext_slack_member_id',
  )
}
