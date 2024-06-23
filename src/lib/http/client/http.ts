import { HttpRequestException } from '@/lib/http/client/http-request-exception'

export const http = {
  get: async <TData>(url: string, options?: RequestInit) =>
    sendRequest<TData>(url, {
      method: 'GET',
      ...options,
    }),
  post: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    sendRequest<TData>(url, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    }),
  put: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    sendRequest<TData>(url, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    }),
  patch: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    sendRequest<TData>(url, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    }),
  delete: async <TData>(url: string, options?: RequestInit) =>
    sendRequest<TData>(url, {
      method: 'DELETE',
      ...options,
    }),
}

export const sendRequest = async <TData>(
  url: string,
  options: RequestInit = {},
) => {
  // Init errors here before async calls to preserve stack trace
  // Reference: https://stackoverflow.com/questions/59726106/stacktrace-incomplete-when-throwing-from-async-catch
  const requestException = new HttpRequestException(400, 'error')

  const headers = options.headers ? new Headers(options.headers) : new Headers()

  headers.append('Accept', 'application/json')

  if (options.body && !(options.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json')
  }

  options.headers = headers

  const response = await fetch(url, options)

  if (response.status === 401) {
    requestException.statusCode = 401
    requestException.message = 'Unauthenticated'
    throw requestException
  }

  const failed = response.status > 299
  if (failed) {
    const exceptionData = await getExceptionData(response)
    requestException.statusCode = exceptionData.status
    requestException.data = exceptionData.data
    requestException.message = exceptionData.message

    throw requestException
  }

  try {
    return (await response.clone().json()) as TData
  } catch (error: unknown) {
    if (
      error instanceof SyntaxError &&
      error.message === 'Unexpected end of JSON input'
    ) {
      return (await response.clone().text()) as TData
    }

    return null as TData
  }
}

async function getExceptionData(response: Response) {
  try {
    const data: Record<string, any> = await response.clone().json()
    const message: string = data.message ?? data.error ?? 'Request failed.'

    return {
      status: response.status,
      message,
      data,
    }
  } catch {
    return {
      message: await response.text(),
      status: response.status,
    }
  }
}
