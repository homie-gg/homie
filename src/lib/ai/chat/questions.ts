// import { howLongOnTask } from '@/lib/ai/chat/answers/02-how-long-on-task'
// import { whoAvailable } from '@/lib/ai/chat/answers/01-who-available'
// import { whoWorkedOnFeature } from '@/lib/ai/chat/answers/03-who-worked-on-feature'
// import { whatPullRequestsForFeature } from '@/lib/ai/chat/answers/04-what-pull-requests-for-feature'
// import { whatPullRequestsMerged } from '@/lib/ai/chat/answers/05-what-pull-requests-merged'
// import { whoCanHelpWithTask } from '@/lib/ai/chat/answers/06-who-can-help-with-task'
// import { whatAreTheyWorkingOn } from '@/lib/ai/chat/answers/07-what-are-they-working-on'
// import { whenLastMerge } from '@/lib/ai/chat/answers/08-when-last-merge'
import { AnswerFunction } from '@/lib/ai/chat/types'

export const questions: Record<string, AnswerFunction> = {
  // 'Who is available for work': whoAvailable,
  // 'How long has a specific person been working on a target task': howLongOnTask,
  // 'Asking who worked on a specific feature': whoWorkedOnFeature,
  // 'What were the pull requests for a specific feature':
  //   whatPullRequestsForFeature,
  // 'Asking for the Pull Requests that were merged': whatPullRequestsMerged,
  // 'Who can help with a specific task': whoCanHelpWithTask,
  // 'What is a specific person, or team working on': whatAreTheyWorkingOn,
  // 'When was the last merge to a specific branch': whenLastMerge,
}
