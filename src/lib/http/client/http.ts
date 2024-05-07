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
  const headers = options.headers ? new Headers(options.headers) : new Headers()

  headers.append('Accept', 'application/json')

  if (options.body && !(options.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json')
  }

  options.headers = headers

  const response = await fetch(url, options)

  if (response.status === 401) {
    throw new HttpRequestException(response.status, 'Unauthenticated')
  }

  const failed = response.status > 299
  if (failed) {
    const exception = await getException(response)
    throw exception
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

async function getException(response: Response) {
  try {
    const data: Record<string, any> = await response.clone().json()
    const message: string = data.message ?? data.error ?? 'Request failed.'
    return new HttpRequestException(response.status, message, data)
  } catch {
    const errorMessage = await response.text()
    return new HttpRequestException(response.status, errorMessage)
  }
}
