import { handleReplySlackMention } from '@/queue/handlers/handle-reply-slack-mention'
import { handleAskSlackSelectGithubRepoForIssue } from '@/queue/handlers/handle-ask-slack-select-github-repo-for-issue'
import { handleCreateGithubIssueFromSlack } from '@/queue/handlers/handle-create-github-issue-from-slack'
import { handleGenerateOpenPullRequestSummary } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { handleImportPullRequests } from '@/queue/handlers/handle-import-pull-requests'
import { handleSaveMergedPullRequest } from '@/queue/handlers/handle-save-merged-pull-request'
import { handleSaveOpenedPullRequest } from '@/queue/handlers/handle-save-opened-pull-request'
import { Job } from '@/queue/jobs'
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
import { handleClosePullRequest } from '@/queue/handlers/handle-closed-pull-request'
import { handleCloseMergeRequest } from '@/queue/handlers/handle-close-merge-request'
import { handleReopenMergeRequest } from '@/queue/handlers/handle-reopen-merge-request'
import { handleReopenPullRequest } from '@/queue/handlers/handle-reopen-pull-request'
import { handleCheckForDuplicateTask } from '@/queue/handlers/handle-check-for-duplicate-task'
import { handleMigrateOrganizationEmbeddings } from '@/queue/handlers/handle-migrate-organization-embeddings'
import { handleMigrateTaskEmbeddings } from '@/queue/handlers/handle-migrate-organization-task-embeddings'
import { handleCheckForUnclosedTask } from '@/queue/handlers/handle-check-unclosed-task'
import { handleCalculateOrganizationComplexityScorePerDay } from '@/queue/handlers/handle-calculate-organization-complexity-score-per-day'
import { handleCalculateTaskComplexity } from '@/queue/handlers/handle-calculate-task-complexity'
import { handleSendSimilarPullRequestsForTask } from '@/queue/handlers/handle-send-similar-pull-requests-for-task'
import { handleSendOrganizationDailyReport } from '@/queue/handlers/handle-send-organization-daily-report'
import { handleSendDailyReports } from '@/queue/handlers/handle-send-daily-reports'

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
  close_pull_request: handleClosePullRequest,
  reopen_pull_request: handleReopenPullRequest,
  save_merged_pull_request: handleSaveMergedPullRequest,
  close_linked_tasks: handleCloseLinkedTasks,
  generate_open_pull_request_summary: handleGenerateOpenPullRequestSummary,
  reply_slack_mention: handleReplySlackMention,
  import_gitlab_projects: handleImportGitlabProjects,
  import_gitlab_merge_requests: handleImportGitlabMergeRequests,
  reopen_merge_request: handleReopenMergeRequest,
  close_merge_request: handleCloseMergeRequest,
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
  check_for_duplicate_task: handleCheckForDuplicateTask,
  send_similar_pull_requests_for_task: handleSendSimilarPullRequestsForTask,
  calculate_task_complexity: handleCalculateTaskComplexity,
  sync_asana_task_to_homie_task: handleSyncAsanaTaskToHomieTask,
  migrate_organization_embeddings: handleMigrateOrganizationEmbeddings,
  migrate_task_embeddings: handleMigrateTaskEmbeddings,
  check_for_unclosed_task: handleCheckForUnclosedTask,
  calculate_organization_complexity_score_per_day:
    handleCalculateOrganizationComplexityScorePerDay,
  send_daily_reports: handleSendDailyReports,
  send_organization_daily_report: handleSendOrganizationDailyReport,
}
