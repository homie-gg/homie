import { seedTaskStatuses } from '@/database/seeders/seed-task-statuses'
import { seedTaskTypes } from '@/database/seeders/seed-task-types'

/**
 * Database Seeders
 */
const seeders = [seedTaskStatuses, seedTaskTypes]

;(async () => {
  for (const seeder of seeders) {
    // eslint-disable-next-line no-console
    console.log(`Running: ${seeder.name}`)
    await seeder()
  }

  // eslint-disable-next-line no-console
  console.log('Seeding: completed!')
  process.exit()
})()
