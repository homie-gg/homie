/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'contributor',
    },
    'ext_gh_user_id',
    {
      type: 'bigint',
      notNull: true,
    },
  )

  pgm.alterColumn(
    {
      schema: 'github',
      name: 'organization',
    },
    'ext_gh_install_id',
    {
      type: 'bigint',
      notNull: true,
    },
  )

  pgm.alterColumn(
    {
      schema: 'github',
      name: 'repo',
    },
    'ext_gh_repo_id',
    {
      type: 'bigint',
      notNull: true,
    },
  )

  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    'ext_gh_pull_request_id',
    {
      type: 'bigint',
      notNull: false,
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'contributor',
    },
    'ext_gh_user_id',
    {
      type: 'integer',
      notNull: true,
    },
  )

  pgm.alterColumn(
    {
      schema: 'github',
      name: 'organization',
    },
    'ext_gh_install_id',
    {
      type: 'integer',
      notNull: true,
    },
  )

  pgm.alterColumn(
    {
      schema: 'github',
      name: 'repo',
    },
    'ext_gh_repo_id',
    {
      type: 'integer',
      notNull: true,
    },
  )

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
}
