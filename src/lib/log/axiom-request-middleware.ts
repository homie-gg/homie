import { NextMiddleware, NextRequest } from 'next/server'
import { Axiom } from '@axiomhq/js'
import { v4 as uuid } from 'uuid'

const axiom = new Axiom({
  token: process.env.NEXT_PUBLIC_AXIOM_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID!,
})

export default function axiomRequestMiddleware(
  middleware: NextMiddleware,
): NextMiddleware {
  return async (request, event) => {
    const id = uuid()

    let reqBody = null

    try {
      reqBody = await request.clone().json()
    } catch {
      try {
        reqBody = await request.clone().text()
      } catch {
        // back request
      }
    }

    axiom.ingest(process.env.NEXT_PUBLIC_AXIOM_DATASET!, [
      {
        message: 'REQ',
        id,
        data: {
          event: 'req.init',
          url: request.url,
          pathname: request.nextUrl.pathname,
          search: request.nextUrl.search,
          method: request.method,
          referrer: request.referrer,
          ip: request.ip,
          data: await getRequestBody(request),
        },
      },
    ])

    await axiom.flush()

    const response = await middleware(request, event)

    axiom.ingest(process.env.NEXT_PUBLIC_AXIOM_DATASET!, [
      {
        id,
        message: 'RES',
        data: {
          event: 'req.done',
          body: response?.body ?? null,
          status: response?.status,
          redirected: response?.redirected,
          statusText: response?.statusText,
          url: request.url,
          pathname: request.nextUrl.pathname,
          search: request.nextUrl.search,
        },
      },
    ])

    await axiom.flush()

    return response
  }
}

async function getRequestBody(request: NextRequest) {
  try {
    return await request.clone().json()
  } catch {
    try {
      return await request.clone().text()
    } catch {
      return null
    }
  }
}
