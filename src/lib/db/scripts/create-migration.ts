import * as childProcess from 'node:child_process'
import process from 'node:process'

const [_node, _script, name] = process.argv

childProcess.execSync(
  `npx node-pg-migrate --migration-file-language ts -m src/lib/db/migrations create ${name}`,
)

// eslint-disable-next-line no-console
console.log(`Migration ${name} created`)
