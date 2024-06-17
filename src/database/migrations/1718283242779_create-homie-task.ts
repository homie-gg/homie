/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  return pgm.createTable(
    { schema: 'homie', name: 'task' },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      name: { type: 'text', notNull: true },
      description: { type: 'text', notNull: true },
      is_assigned: {
        type: 'boolean',
        default: false,
        notNull: true,
      },
      ext_gh_issue_id: { type: 'string', unique: true, notNull: false },
      ext_gh_issue_number: { type: 'integer', unique: true, notNull: false },
      task_status_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'task_status',
        },
      },
      task_type_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'task_type',
        },
      },
      html_url: { type: 'text', notNull: true },
      due_date: { type: 'timestamptz', notNull: false },
      completed_at: { type: 'timestamptz', notNull: false },
      priority_level: {
        type: 'integer',
        notNull: true,
      },
      organization_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'organization',
        },
      },
      github_repo_id: {
        type: 'integer',
        notNull: false,
        references: {
          schema: 'github',
          name: 'repo',
        },
        onDelete: 'CASCADE',
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  return pgm.dropTable('homie.task')
}
