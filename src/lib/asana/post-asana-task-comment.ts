import { createAsanaClient } from '@/lib/asana/create-asana-client'

type PostAsanaTaskCommentParams =
  | {
      text: string
      asanaAccessToken: string
      extAsanaTaskId: string
    }
  | {
      html: string
      asanaAccessToken: string
      extAsanaTaskId: string
    }

export async function postAsanaTaskComment(params: PostAsanaTaskCommentParams) {
  const { asanaAccessToken, extAsanaTaskId } = params
  const asana = createAsanaClient(asanaAccessToken)

  const data =
    'text' in params
      ? {
          text: params.text,
        }
      : {
          html_text: params.html,
        }

  await asana.post(`/tasks/${extAsanaTaskId}/stories`, {
    data,
  })
}
