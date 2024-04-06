import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { getDefaultQueue } from '@/queue/default-queue'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/jobs')

createBullBoard({
  queues: [new BullAdapter(getDefaultQueue())],
  serverAdapter: serverAdapter,
})

const app = express()

app.use('/jobs', serverAdapter.getRouter())
app.get('/', (req, res) => res.send('ok'))

app.listen(3100, () => {
  // eslint-disable-next-line no-console
  console.log('Running on 3100...')
  // eslint-disable-next-line no-console
  console.log('For the UI, open http://localhost:3100/jobs')
})
