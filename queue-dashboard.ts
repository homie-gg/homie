import express from 'express'
import basicAuth from 'express-basic-auth'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { getQueue } from '@/queue/get-queue'
import { config } from '@/config'
import process from 'node:process'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/jobs')

// Add auth to require password for access
const auth = basicAuth({
  users: { admin: process.env.QUEUE_DASHBOARD_PASSWORD ?? '' },
  challenge: true, // Will show browser prompt
})

createBullBoard({
  queues: Object.keys(config.queue.queues).map(
    (queue) => new BullMQAdapter(getQueue(queue)),
  ),
  serverAdapter: serverAdapter,
})

const app = express()

// Apply auth middleware to /jobs routes only
app.use('/jobs', auth)

app.use('/jobs', serverAdapter.getRouter())
app.get('/', (_req, res) => res.send('ok'))

app.listen(3100, () => {
  // eslint-disable-next-line no-console
  console.log('Running on 3100...')
  // eslint-disable-next-line no-console
  console.log('For the UI, open http://localhost:3100/jobs')
})
