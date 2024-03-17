import { KyselyDatabaseInstance } from '@/lib/db/scripts/types'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { getConnectionStringFromEnv } from 'pg-connection-from-env'
import process from 'node:process'

export const dbClient: KyselyDatabaseInstance = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: getConnectionStringFromEnv({
        fallbackDefaults: {
          database: process.env.POSTGRES_DB,
        },
      }),
    }),
  }),
})
