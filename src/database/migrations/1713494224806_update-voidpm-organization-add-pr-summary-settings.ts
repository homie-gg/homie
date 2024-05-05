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
      send_pull_request_summaries_enabled: {
        type: 'boolean',
        default: true,
        notNull: true,
      },
    },
  )

  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      send_pull_request_summaries_interval: {
        type: 'string',
        default: 'weekly',
        notNull: true,
      },
    },
  )

  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      send_pull_request_summaries_day: {
        type: 'string',
        default: '7',
        notNull: true,
      },
    },
  )

  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      send_pull_request_summaries_time: {
        type: 'string',
        default: '22:00',
        notNull: true,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    'send_pull_request_summaries_enabled',
  )

  pgm.dropColumns(
    {
      schema: 'homie',
      name: 'organization',
    },
    [
      'send_pull_request_summaries_enabled',
      'send_pull_request_summaries_interval',
      'send_pull_request_summaries_day',
      'send_pull_request_summaries_time',
    ],
  )
}
