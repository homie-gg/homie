import { http } from '@/lib/http/client/http'

const asanaApi = (path: string) => {
  return `https://app.asana.com/api/1.0${path}`
}

function createOptions(
  accessToken: string,
  options: RequestInit = {},
): RequestInit {
  const headers = options.headers ? new Headers(options.headers) : new Headers()

  headers.append('Authorization', `Bearer ${accessToken}`)

  options.headers = headers

  return options
}

export const createAsanaClient = (accessToken: string) => ({
  get: async <TData>(url: string, options?: RequestInit): Promise<TData> =>
    http.get<TData>(asanaApi(url), createOptions(accessToken, options)),
  post: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    http.post<TData>(asanaApi(url), data, createOptions(accessToken, options)),
  put: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    http.put<TData>(asanaApi(url), data, createOptions(accessToken, options)),
  patch: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    http.patch<TData>(asanaApi(url), data, createOptions(accessToken, options)),
  delete: async <TData>(url: string, options?: RequestInit): Promise<TData> =>
    http.delete<TData>(asanaApi(url), createOptions(accessToken, options)),
})
