import { NextMiddleware } from 'next/server'
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

    const reqBody = await getBody(request)

    axiom.ingest(process.env.NEXT_PUBLIC_AXIOM_DATASET!, [
      {
        message: 'REQ',
        event: 'req.init',
        data: {
          id,
          method: request.method,
          url: request.url,
          pathname: request.nextUrl.pathname,
          search: request.nextUrl.search,
          req_body: reqBody,
          referrer: request.referrer,
          ip: request.ip,
        },
      },
    ])

    await axiom.flush()

    const response = await middleware(request, event)

    axiom.ingest(process.env.NEXT_PUBLIC_AXIOM_DATASET!, [
      {
        id,
        message: 'RES',
        event: 'req.done',
        data: {
          method: request.method,
          url: request.url,
          pathname: request.nextUrl.pathname,
          search: request.nextUrl.search,
          req_body: reqBody,
          res_body: response ? getBody(response) : null,
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

async function getBody(request: Request | Response) {
  try {
    const json = await request.clone().json()
    // Stringify to avoid hitting fields limit
    return {
      content: JSON.stringify(json),
    }
  } catch {
    try {
      return {
        content: request.clone().text(),
      }
    } catch {
      return null
    }
  }
}
