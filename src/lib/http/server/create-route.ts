import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@/lib/http/server/exceptions'
import { handleExceptions } from '@/lib/http/server/exception-handler'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

export function createRoute<
  TBodyParams,
  TQueryParams,
  TJsonBody,
  TExpectsFormData,
>(
  config: {
    bodyParams?: TBodyParams
    bodyIsFormData?: TExpectsFormData
    queryParams?: TQueryParams
    jsonBody?: TJsonBody
  },
  handleRequest: (request: {
    body: TBodyParams extends z.AnyZodObject
      ? TExpectsFormData extends boolean
        ? FormData
        : z.infer<TBodyParams>
      : null
    cookies: NextRequest['cookies']
    nextUrl: NextRequest['nextUrl']
    query: TQueryParams extends z.AnyZodObject ? z.infer<TQueryParams> : null
  }) => TJsonBody extends z.AnyZodObject
    ? Promise<NextResponse<z.infer<TJsonBody>>>
    : Promise<NextResponse<Record<PropertyKey, never>>>,
) {
  return async (
    request: NextRequest,
    context: { params: Record<string, string> },
  ) => {
    return handleExceptions(async () => {
      const bodyParams = config.bodyParams as z.AnyZodObject | undefined
      const body = (await parseBody(bodyParams, request)) as any

      const queryParams = config.queryParams as z.AnyZodObject | undefined
      const query = (await parseQuery(queryParams, context.params)) as any

      const response = await handleRequest({
        body,
        cookies: request.cookies,
        nextUrl: request.nextUrl,
        query,
      })

      const jsonBody = config.jsonBody as z.AnyZodObject | undefined
      if (!jsonBody) {
        return response as unknown as Promise<
          NextResponse<Record<PropertyKey, never>>
        >
      }

      try {
        jsonBody.parse(await response.clone().json()) // Clone to avoid already read response error
        return response as unknown as NextResponse<TJsonBody>
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          throw new InternalServerErrorException({
            type: 'unknown_response',
            message: createZodErrorMessage(error),
            errors: error.format(),
          })
        }

        return response
      }
    })
  }
}

async function parseBody<TBodyParams extends z.AnyZodObject>(
  bodyParams: TBodyParams | undefined,
  request: NextRequest,
) {
  if (!bodyParams) {
    return null
  }

  const { data, formData } = await getData(request)

  try {
    if (formData) {
      bodyParams.parse(data)
      return formData
    }

    return bodyParams.parse(data)
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      throw new BadRequestException({
        type: 'invalid_data',
        message: createZodErrorMessage(error),
        errors: error.format(),
      })
    }

    if (
      error instanceof SyntaxError &&
      error.message === 'Unexpected end of JSON input'
    ) {
      throw new BadRequestException({
        type: 'invalid_data',
        message: 'Invalid JSON',
      })
    }

    throw error
  }
}

async function getData(request: NextRequest) {
  try {
    const formData = await request.clone().formData()

    const object: Record<string, any> = {}

    for (const [key, value] of formData.entries()) {
      object[key] = value
    }

    return { data: object, formData }
  } catch {
    return { data: await request.clone().json() }
  }
}

function createZodErrorMessage(error: ZodError) {
  const numIssues = error.issues.length
  if (numIssues === 1) {
    return createMessageFromZodIssue(error.issues[0])
  }

  const messages = error.issues.map((issue) => createMessageFromZodIssue(issue))
  return `${numIssues} Input Errors: ` + messages.join(', ')
}

const createMessageFromZodIssue = (issue: z.ZodIssue) => {
  if (issue.path.join('.') === '') {
    return issue.message
  }
  if (issue.message === 'Required') {
    return `${issue.path.join('.')} is required`
  }
  return `${issue.message} for "${issue.path.join('.')}"`
}

async function parseQuery<TQueryParmas extends z.AnyZodObject>(
  queryParmas: TQueryParmas | undefined,
  contextParams: Record<string, string>,
) {
  if (!queryParmas) {
    return null
  }

  try {
    return queryParmas.parse(contextParams)
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      throw new NotFoundException({
        type: 'missing_query_param',
        message: createZodErrorMessage(error),
        errors: error.format(),
      })
    }

    throw error
  }
}
