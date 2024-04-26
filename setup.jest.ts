import dotenv from 'dotenv'
import { Client } from 'pg'
import { getConnectionStringFromEnv } from 'pg-connection-from-env'
import migrate from 'node-pg-migrate'
import { join } from 'node:path'
import { dbClient } from '@/database/client'

dotenv.config({ path: '.env.local' })

process.env['QUEUE_DRIVER'] = 'sync'

beforeAll(async () => {
  await initDatabase()
})

const initDatabase = async () => {
  const database = process.env.POSTGRES_DB

  const rootClient = new Client({
    connectionString: getConnectionStringFromEnv({
      database: 'postgres',
    }),
  })
  await rootClient.connect()
  await rootClient.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`)
  await rootClient.query(`CREATE DATABASE ${database};`)
  await rootClient.end()

  const voidClient = new Client({
    connectionString: getConnectionStringFromEnv({
      database,
    }),
  })
  await voidClient.connect()

  await migrate({
    dbClient: voidClient,
    direction: 'up',
    schema: 'public',
    createSchema: true,
    createMigrationsSchema: true,
    migrationsSchema: 'migrations',
    migrationsTable: 'pgmigrations',
    verbose: false,
    log: () => {}, // silence logs
    dir: join(__dirname, 'src', 'database', 'migrations'),
  })

  await voidClient.end()
}
