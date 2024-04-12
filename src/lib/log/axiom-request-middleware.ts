import { NextMiddleware } from 'next/server'
import { Axiom } from '@axiomhq/js'
import { v4 as uuid } from 'uuid'

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID!,
})

export default function axiomRequestMiddleware(
  middleware: NextMiddleware,
): NextMiddleware {
  return async (request, event) => {
    const id = uuid()

    axiom.ingest(process.env.AXIOM_DATASET!, [
      {
        message: 'REQ',
        id,
        data: {
          event: 'req.init',
          url: request.url,
          method: request.method,
          referrer: request.referrer,
          ip: request.ip,
        },
      },
    ])

    await axiom.flush()

    const response = await middleware(request, event)

    axiom.ingest(process.env.AXIOM_DATASET!, [
      {
        id,
        message: 'RES',
        data: {
          event: 'req.done',
          body: response?.body ?? null,
          status: response?.status,
          redirected: response?.redirected,
          statusText: response?.statusText,
        },
      },
    ])

    await axiom.flush()

    return response
  }
}
