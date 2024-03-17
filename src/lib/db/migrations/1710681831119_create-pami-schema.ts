import {
  MigrationBuilder,
  ColumnDefinitions,
  ColumnDefinition,
  PgLiteral,
} from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = {
  primary_uuid: {
    type: 'uuid',
    primaryKey: true,
    notNull: true,
    default: PgLiteral.create('gen_random_uuid()'),
  },

  created_or_updated_at: {
    type: 'timestamptz',
    notNull: true,
    default: PgLiteral.create('current_timestamp'),
  },
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createSchema('pami', { ifNotExists: true })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropSchema('pami', { cascade: true })
}
