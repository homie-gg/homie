import { getConnectionStringFromEnv } from 'pg-connection-from-env'
import * as zg from 'zapatos/generate'
import process from 'node:process'

const database = process.env.POSTGRES_DB

;(async () => {
  await zg.generate({
    db: {
      connectionString: getConnectionStringFromEnv({
        fallbackDefaults: {
          database,
        },
      }),
    },
    schemas: Object.fromEntries(
      ['voidpm', 'github'].map((s) => [
        s,
        {
          include: '*',
          exclude: [],
        },
      ]),
    ),
    outDir: 'src/lib/db/schema',
  })
})()
