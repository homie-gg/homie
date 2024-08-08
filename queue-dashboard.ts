import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { getQueue } from '@/queue/get-queue'
import { config } from '@/config'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/jobs')

createBullBoard({
  queues: Object.keys(config.queue.queues).map(
    (queue) => new BullAdapter(getQueue(queue)),
  ),
  serverAdapter: serverAdapter,
})

const app = express()

app.use('/jobs', serverAdapter.getRouter())
app.get('/', (_req, res) => res.send('ok'))

app.listen(3100, () => {
  // eslint-disable-next-line no-console
  console.log('Running on 3100...')
  // eslint-disable-next-line no-console
  console.log('For the UI, open http://localhost:3100/jobs')
})
