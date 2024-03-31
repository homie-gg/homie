import { defaultQueue } from '@/queue/default-queue'
import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [new BullAdapter(defaultQueue)],
  serverAdapter: serverAdapter,
})

const app = express()

app.use('/admin/queues', serverAdapter.getRouter())

app.listen(3100, () => {
  console.log('Running on 3100...')
  console.log('For the UI, open http://localhost:3100/admin/queues')
})
