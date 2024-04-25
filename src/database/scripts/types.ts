import { ColumnType, Kysely } from 'kysely'
import {
  Table,
  SelectableForTable,
  InsertableForTable,
  UpdatableForTable,
} from 'zapatos/schema'
import { SQLFragment } from 'zapatos/db'

type ZapatosInsertableTypeToPrimitive<T> = Exclude<T, symbol | SQLFragment>

export type ZapatosTableNameToKyselySchema<T extends Table> = {
  [K in keyof SelectableForTable<T>]: ColumnType<
    ZapatosInsertableTypeToPrimitive<SelectableForTable<T>[K]>,
    K extends keyof InsertableForTable<T>
      ? ZapatosInsertableTypeToPrimitive<InsertableForTable<T>[K]>
      : never,
    K extends keyof UpdatableForTable<T>
      ? ZapatosInsertableTypeToPrimitive<UpdatableForTable<T>[K]>
      : never
  >
}

export type KyselySchema = {
  readonly [T in Table]: ZapatosTableNameToKyselySchema<T>
}

export type KyselyDatabaseInstance = Kysely<KyselySchema>
