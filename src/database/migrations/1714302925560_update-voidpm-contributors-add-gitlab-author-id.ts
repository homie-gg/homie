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
      ext_gitlab_author_id: {
        type: 'integer',
        notNull: false,
        default: null,
        unique: true,
      },
    },
  )

  pgm.alterColumn(
    {
      schema: 'homie',
      name: 'contributor',
    },
    'ext_gh_user_id',
    {
      type: 'integer',
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

  pgm.dropColumn(
    {
      schema: 'homie',
      name: 'contributor',
    },
    'ext_gitlab_author_id',
  )
}
