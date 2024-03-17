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
  pgm.createSchema('myapp', { ifNotExists: true })

  /**
   * Shorthand for creating tables within the sp schema to improve readability
   * of initial migration.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createTableWithDefaults = (
    tableName: string,
    columns: ColumnDefinitions,
    tableOpts: Parameters<typeof pgm.createTable>[2] = undefined,
  ) => {
    return pgm.createTable(
      { schema: 'myapp', name: tableName },
      {
        [`${tableName}_id`]: 'primary_uuid',
        ...columns,
        created_at: 'created_or_updated_at',
        updated_at: 'created_or_updated_at',
      },
      tableOpts,
    )
  }

  /**
   * Helper to automatically create a FK constraint on another table's PK
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const referencesPK = (
    tableName: string,
    colOpts?: Partial<ColumnDefinition>,
  ) => {
    const options = colOpts ?? { notNull: true }

    return {
      type: 'uuid',
      references: {
        schema: 'myapp',
        name: tableName,
      },
      ...options,
    }
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropSchema('myapp', { cascade: true })
}
