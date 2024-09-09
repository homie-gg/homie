import { Job } from '@/queue/create-job'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function getJobs() {
  const jobs: Record<string, Job> = {}

  for (const file of await fs.readdir(path.join(__dirname, 'jobs'))) {
    const module = await import(path.join(__dirname, 'jobs', file))
    const job = Object.values(module)[0] as Job

    jobs[job.id] = job
  }

  return jobs
}
