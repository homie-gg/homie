/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    { schema: 'homie', name: 'contributor_task' },
    {
      id: 'id',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      contributor_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'contributor',
        },
        onDelete: 'CASCADE',
      },
      task_id: {
        type: 'integer',
        notNull: true,
        references: {
          schema: 'homie',
          name: 'task',
        },
        onDelete: 'CASCADE',
      },
    },
  )

  pgm.addConstraint(
    { schema: 'homie', name: 'contributor_task' },
    'uniq_contributor_task_contributor_id_task_id',
    'UNIQUE(contributor_id, task_id)',
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  return pgm.dropTable('homie.contributor_task')
}
