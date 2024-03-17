import { HttpRequestException } from '@/lib/http/client/http-request-exception'
import { HttpException } from '@/lib/http/server/exceptions'
import { NextResponse } from 'next/server'

export const handleExceptions = async (
  handler: () => Promise<NextResponse>,
) => {
  try {
    return await handler()
  } catch (error: unknown) {
    if (error instanceof HttpRequestException) {
      return NextResponse.json(
        {
          type: 'bad_request',
          message: error.message,
          errors: error.data,
        },
        {
          status: error.statusCode,
        },
      )
    }

    if (error instanceof HttpException) {
      const { type, message, ...otherMetadata } = error.metadata
      return NextResponse.json(
        {
          type,
          message,
          ...otherMetadata,
        },
        {
          status: error.status,
        },
      )
    }

    return NextResponse.json(
      {
        type: 'internal_server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
      },
    )
  }
}
