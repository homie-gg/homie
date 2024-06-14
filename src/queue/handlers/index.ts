import { handleReplySlackMention } from '@/queue/handlers/handle-reply-slack-mention'
import { handleAskSlackSelectGithubRepoForIssue } from '@/queue/handlers/handle-ask-slack-select-github-repo-for-issue'
import { handleCreateGithubIssueFromSlack } from '@/queue/handlers/handle-create-github-issue-from-slack'
import { handleGenerateOpenPullRequestSummary } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { handleImportPullRequests } from '@/queue/handlers/handle-import-pull-requests'
import { handleSaveMergedPullRequest } from '@/queue/handlers/handle-save-merged-pull-request'
import { handleSaveOpenedPullRequest } from '@/queue/handlers/handle-save-opened-pull-request'
import { Job } from '@/queue/jobs'
import { handleSendPullRequestSummaries } from '@/queue/handlers/handle-send-pull-request-summaries'
import { handleSendPullRequestSummariesToOrganization } from '@/queue/handlers/handle-send-pull-request-summaries-to-organization'
import { handleCreateTrelloTaskFromSlack } from '@/queue/handlers/handle-create-trello-task-from-slack'
import { handleCloseLinkedTasks } from '@/queue/handlers/handle-closed-linked-tasks'
import { handleImportGitlabProjects } from '@/queue/handlers/handle-import-gitlab-projects'
import { handleImportGitlabMergeRequests } from '@/queue/handlers/handle-import-gitlab-merge-requests'
import { handleSaveMergedMergeRequest } from '@/queue/handlers/handle-save-merged-merge-request'
import { handleGenerateOpenMergeRequestSummary } from '@/queue/handlers/handle-generate-open-merge-request-summary'
import { handleSaveOpenedMergeRequest } from '@/queue/handlers/handle-save-opened-merge-request'
import { handleRefreshGitlabTokens } from '@/queue/handlers/handle-refresh-gitlab-tokens'
import { handleReplySlackThread } from '@/queue/handlers/handle-reply-slack-thread'
import { handleDispatchDebouncedJob } from '@/queue/handlers/handle-dispatch-debounced-job'
import { handleCreateTaskFromGithubIssue } from '@/queue/handlers/handle-create-task-from-github-issue'
import { handleImportGithubIssues } from '@/queue/handlers/handle-import-github-issues'

type HandlerFunc<TJob extends Job> = (job: TJob) => void | Promise<void>

type Handlers = {
  [J in Job as J['name']]: HandlerFunc<J>
}

export const handlers: Handlers = {
  create_github_issue_from_slack: handleCreateGithubIssueFromSlack,
  create_task_from_github_issue: handleCreateTaskFromGithubIssue,
  ask_slack_select_github_repo_for_issue:
    handleAskSlackSelectGithubRepoForIssue,
  create_trello_task_from_slack: handleCreateTrelloTaskFromSlack,
  import_pull_requests: handleImportPullRequests,
  import_github_issues: handleImportGithubIssues,
  save_opened_pull_request: handleSaveOpenedPullRequest,
  save_merged_pull_request: handleSaveMergedPullRequest,
  close_linked_tasks: handleCloseLinkedTasks,
  generate_open_pull_request_summary: handleGenerateOpenPullRequestSummary,
  reply_slack_mention: handleReplySlackMention,
  reply_slack_thread: handleReplySlackThread,
  send_pull_request_summaries: handleSendPullRequestSummaries,
  send_pull_request_summaries_to_organization:
    handleSendPullRequestSummariesToOrganization,
  import_gitlab_projects: handleImportGitlabProjects,
  import_gitlab_merge_requests: handleImportGitlabMergeRequests,
  save_merged_merge_request: handleSaveMergedMergeRequest,
  generate_open_merge_request_summary: handleGenerateOpenMergeRequestSummary,
  save_opened_merge_request: handleSaveOpenedMergeRequest,
  refresh_gitlab_tokens: handleRefreshGitlabTokens,
  dispatch_debounced_job: handleDispatchDebouncedJob,
}
