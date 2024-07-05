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
import { handleDispatchDebouncedJob } from '@/queue/handlers/handle-dispatch-debounced-job'
import { handleImportGithubIssues } from '@/queue/handlers/handle-import-github-issues'
import { handleCreateHomieTaskFromTrelloTask } from '@/queue/handlers/handle-create-homie-task-from-trello-task'
import { handleCreateHomieTaskFromGithubIssue } from '@/queue/handlers/handle-create-homie-task-from-github-issue'
import { handleUpdateHomieTaskFromTrelloTask } from '@/queue/handlers/handle-update-homie-task-from-trello-task'
import { handleUpdateHomieTaskFromGithubIssue } from '@/queue/handlers/handle-update-homie-task-from-github-issue'
import { handleRefreshAsanaTokens } from '@/queue/handlers/handle-refresh-asana-tokens'
import { handleImportAsanaProjects } from '@/queue/handlers/handle-import-asana-projects'
import { handleCreateAsanaTaskFromSlack } from '@/queue/handlers/handle-create-asana-task-from-slack'
import { handleAskSlackSelectAsanaProjectForTask } from '@/queue/handlers/handle-ask-slack-select-asana-project-for-task'
import { handleSyncAsanaTaskToHomieTask } from '@/queue/handlers/handle-sync-asana-task-to-homie-task'
import { handleImportAsanaTasks } from '@/queue/handlers/handle-import-asana-tasks'

type HandlerFunc<TJob extends Job> = (job: TJob) => void | Promise<void>

type Handlers = {
  [J in Job as J['name']]: HandlerFunc<J>
}

export const handlers: Handlers = {
  create_github_issue_from_slack: handleCreateGithubIssueFromSlack,
  create_homie_task_from_github_issue: handleCreateHomieTaskFromGithubIssue,
  update_homie_task_from_github_issue: handleUpdateHomieTaskFromGithubIssue,
  ask_slack_select_github_repo_for_issue:
    handleAskSlackSelectGithubRepoForIssue,
  create_trello_task_from_slack: handleCreateTrelloTaskFromSlack,
  create_homie_task_from_trello_task: handleCreateHomieTaskFromTrelloTask,
  update_homie_task_from_trello_task: handleUpdateHomieTaskFromTrelloTask,
  import_pull_requests: handleImportPullRequests,
  import_github_issues: handleImportGithubIssues,
  save_opened_pull_request: handleSaveOpenedPullRequest,
  save_merged_pull_request: handleSaveMergedPullRequest,
  close_linked_tasks: handleCloseLinkedTasks,
  generate_open_pull_request_summary: handleGenerateOpenPullRequestSummary,
  reply_slack_mention: handleReplySlackMention,
  send_pull_request_summaries: handleSendPullRequestSummaries,
  send_pull_request_summaries_to_organization:
    handleSendPullRequestSummariesToOrganization,
  import_gitlab_projects: handleImportGitlabProjects,
  import_gitlab_merge_requests: handleImportGitlabMergeRequests,
  save_merged_merge_request: handleSaveMergedMergeRequest,
  generate_open_merge_request_summary: handleGenerateOpenMergeRequestSummary,
  save_opened_merge_request: handleSaveOpenedMergeRequest,
  refresh_gitlab_tokens: handleRefreshGitlabTokens,
  import_asana_projects: handleImportAsanaProjects,
  refresh_asana_tokens: handleRefreshAsanaTokens,
  dispatch_debounced_job: handleDispatchDebouncedJob,
  import_asana_tasks: handleImportAsanaTasks,
  ask_slack_select_asana_project_for_task:
    handleAskSlackSelectAsanaProjectForTask,
  create_asana_task_from_slack: handleCreateAsanaTaskFromSlack,
  sync_asana_task_to_homie_task: handleSyncAsanaTaskToHomieTask,
}
