import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { GetAsanaUsersResponse } from '@/lib/asana/types'

interface GetAsanaUsersParams {
  asanaAccessToken: string
}

export async function getAsanaUsers(params: GetAsanaUsersParams) {
  const { asanaAccessToken } = params

  const asana = createAsanaClient(asanaAccessToken)

  const { data } = await asana.get<GetAsanaUsersResponse>('/users')
  return data
}
