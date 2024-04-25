import { Client } from 'pg'
import { getConnectionStringFromEnv } from 'pg-connection-from-env'
import process from 'node:process'

const database = process.env.POSTGRES_DB

;(async () => {
  const postgresClient = new Client({
    connectionString: getConnectionStringFromEnv({
      database: 'postgres',
    }),
  })

  await postgresClient.connect()

  // eslint-disable-next-line no-console
  console.log(`Dropping database "${database}"...`)
  await postgresClient
    .query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`)
    .catch((error: Error) => {
      if (error.message.includes(`database "${database}" does not exist`)) {
        return
      }
      throw error
    })

  // eslint-disable-next-line no-console
  console.log(`Creating database "${database}"...`)
  await postgresClient.query(`CREATE DATABASE ${database};`)
  await postgresClient.end()
})()
