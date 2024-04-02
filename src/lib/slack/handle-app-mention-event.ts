import { AppMentionEvent } from '@slack/bolt'

interface HandleAppMentionEventParams {
  event: AppMentionEvent
}

export async function handleAppMentionEvent(
  params: HandleAppMentionEventParams,
) {
  const { event } = params
}
