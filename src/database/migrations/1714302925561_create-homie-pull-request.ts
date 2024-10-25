/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    {
      schema: 'homie',
      name: 'pull_request',
    },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      ext_gh_pull_request_id: { type: 'integer', unique: true, notNull: false },
      ext_gitlab_merge_request_id: {
        type: 'integer',
        unique: true,
        notNull: false,
      },
      ext_gitlab_merge_request_iid: {
        type: 'integer',
        unique: false,
        notNull: false,
      },
      organization_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'organization',
        },
      },
      contributor_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'contributor',
        },
      },
      github_repo_id: {
        type: 'integer',
        notNull: false,
        references: {
          schema: 'github',
          name: 'repo',
        },
      },
      gitlab_project_id: {
        type: 'integer',
        notNull: false,
        references: {
          schema: 'gitlab',
          name: 'project',
        },
      },
      title: { type: 'text', notNull: true },
      html_url: { type: 'text', notNull: true },
      merged_at: {
        type: 'timestamptz',
      },
      closed_at: {
        type: 'timestamptz',
      },
      body: {
        type: 'text',
        notNull: true,
      },
      number: {
        type: 'integer',
        notNull: true,
      },
      embed_value: {
        type: 'text',
        notNull: false,
      },
      embed_metadata: {
        type: 'json', // use json (not jsonb) as we won't be querying / updating this
        notNull: false,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('homie.pull_request')
}
