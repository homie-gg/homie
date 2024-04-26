import { http } from '@/lib/http/client/http'

const trelloApi = (path: string, accessToken: string) =>
  `https://api.trello.com/1${path}?key=${process.env.NEXT_PUBLIC_TRELLO_API_KEY}&token=${accessToken}`

export type TrelloClient = ReturnType<typeof createTrelloClient>

export const createTrelloClient = (accessToken: string) => ({
  get: async <TData>(url: string, options?: RequestInit): Promise<TData> =>
    http.get<TData>(trelloApi(url, accessToken), options),
  post: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) => http.post<TData>(trelloApi(url, accessToken), data, options),
  put: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) => http.put<TData>(trelloApi(url, accessToken), data, options),
  patch: async <TData>(
    url: string,
    data: Record<string, any> | FormData,
    options?: RequestInit,
  ) => http.patch<TData>(trelloApi(url, accessToken), data, options),
  delete: async <TData>(url: string, options?: RequestInit): Promise<TData> =>
    http.delete<TData>(trelloApi(url, accessToken), options),
})
