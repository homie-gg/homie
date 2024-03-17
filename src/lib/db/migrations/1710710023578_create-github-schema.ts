/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createSchema('github', { ifNotExists: true })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropSchema('github', { cascade: true })
}
