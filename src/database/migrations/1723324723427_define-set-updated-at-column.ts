/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

const existingTables: Array<{ schema: string; name: string }> = [
  {
    schema: 'asana',
    name: 'app_user',
  },
  {
    schema: 'asana',
    name: 'project',
  },
  {
    schema: 'github',
    name: 'organization',
  },
  {
    schema: 'github',
    name: 'repo',
  },
  {
    schema: 'gitlab',
    name: 'app_user',
  },
  {
    schema: 'gitlab',
    name: 'project',
  },
  {
    schema: 'homie',
    name: 'contributor',
  },
  {
    schema: 'homie',
    name: 'contributor_task',
  },
  {
    schema: 'homie',
    name: 'duplicate_task_notification',
  },
  {
    schema: 'homie',
    name: 'organization',
  },
  {
    schema: 'homie',
    name: 'plan',
  },
  {
    schema: 'homie',
    name: 'pull_request',
  },
  {
    schema: 'homie',
    name: 'subscription',
  },
  {
    schema: 'homie',
    name: 'task',
  },
  {
    schema: 'homie',
    name: 'task_status',
  },
  {
    schema: 'homie',
    name: 'task_type',
  },
  {
    schema: 'slack',
    name: 'workspace',
  },
  {
    schema: 'trello',
    name: 'workspace',
  },
]

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `BEGIN
  NEW.updated_at = now();
  RETURN NEW;
  END;`,
  )

  // Add trigger to existing tables
  for (const table of existingTables) {
    pgm.createTrigger(table, `${table.name}_updated`, {
      when: 'BEFORE',
      level: 'ROW',
      operation: 'UPDATE',
      function: 'update_updated_at_column',
    })
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  for (const table of existingTables) {
    pgm.dropTrigger(table, `${table.name}_updated`)
  }
  pgm.dropFunction('update_updated_at_column', [])
}
