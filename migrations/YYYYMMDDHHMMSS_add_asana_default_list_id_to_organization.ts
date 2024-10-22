import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('homie.organization')
    .addColumn('asana_default_list_id', 'text')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('homie.organization')
    .dropColumn('asana_default_list_id')
    .execute()
}
