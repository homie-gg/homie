import { http } from '@/lib/http/client/http'

const slackApi = (path: string) => `https://slack.com/api/${path}`

export type SlackClient = ReturnType<typeof createSlackClient>

export const createSlackClient = (accessToken: string) => ({
  get: async <TData>(url: string, options?: RequestInit): Promise<TData> =>
    http.get<TData>(slackApi(url), createConfig(accessToken, options)),
  post: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    http.post<TData>(slackApi(url), data, createConfig(accessToken, options)),
  put: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    http.put<TData>(
      slackApi(url),
      data,
      createConfig(accessToken, { ...options, method: 'PUT' }),
    ),
  patch: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) =>
    http.patch<TData>(
      slackApi(url),
      data,
      createConfig(accessToken, { ...options, method: 'PATCH' }),
    ),
  delete: async <TData>(url: string, options?: RequestInit): Promise<TData> =>
    http.delete<TData>(slackApi(url), createConfig(accessToken, options)),
})

function createConfig(
  accessToken: string,
  options: RequestInit = {},
): RequestInit {
  const headers = options.headers ? new Headers(options.headers) : new Headers()

  headers.append('Authorization', `Bearer ${accessToken}`)

  options.headers = headers

  return options
}
