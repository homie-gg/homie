/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    'ext_gh_pull_request_id',
    {
      type: 'text',
      notNull: false,
    },
  )

  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    'ext_gitlab_merge_request_id',
    {
      type: 'text',
      notNull: false,
    },
  )
  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    'ext_gitlab_merge_request_iid',
    {
      type: 'text',
      notNull: false,
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    'ext_gh_pull_request_id',
    {
      type: 'integer',
      notNull: false,
    },
  )

  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    'ext_gitlab_merge_request_id',
    {
      type: 'integer',
      notNull: false,
    },
  )
  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    'ext_gitlab_merge_request_iid',
    {
      type: 'integer',
      notNull: false,
    },
  )
}
