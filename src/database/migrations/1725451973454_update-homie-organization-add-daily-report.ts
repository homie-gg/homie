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
      send_daily_report_time: {
        type: 'string',
        default: '12:00',
        notNull: true,
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
    ['send_daily_report_time'],
  )
}
