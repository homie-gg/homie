import { GithubOrganization } from '@/database/types'
import { Job as BullMQJob, JobsOptions } from 'bullmq'
import { PullRequest, InstallationLite } from '@octokit/webhooks-types'

export type AskSlackSelectGithubRepoForIssue = BullMQJob<
  {
    team_id: string
    trigger_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
  },
  void, // return type
  'ask_slack_select_github_repo_for_issue'
>

export type CreateGithubIssueFromSlack = BullMQJob<
  {
    team_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
    gh_repo_full_name: string | null
  },
  void, // return type
  'create_github_issue_from_slack'
>

export type ImportPullRequests = BullMQJob<
  {
    github_organization: GithubOrganization
  },
  void, // return type
  'import_pull_requests'
>

export type SaveOpenedPullRequest = BullMQJob<
  {
    pull_request: PullRequest
    installation: InstallationLite | undefined
  },
  void, // return type
  'save_opened_pull_request'
>

export type SaveMergedPullRequest = BullMQJob<
  {
    pull_request: PullRequest
    installation: InstallationLite | undefined
  },
  void, // return type
  'save_merged_pull_request'
>

export type CloseLinkedTasks = BullMQJob<
  {
    pullRequestBody: string
    organization: {
      id: number
    }
  },
  void, // return type
  'close_linked_tasks'
>

export type GenerateOpenPullRequestSummary = BullMQJob<
  {
    pull_request: PullRequest
    installation: InstallationLite | undefined
  },
  void, // return type
  'generate_open_pull_request_summary'
>

export type ReplySlackMention = BullMQJob<
  {
    team_id: string
    channel_id: string
    target_message_ts: string
    thread_ts?: string
    text: string
  },
  void, // return type
  'reply_slack_mention'
>

export type ReplySlackThread = BullMQJob<
  {
    team_id: string
    channel_id: string
    thread_ts: string
    target_message_ts: string
    ext_slack_user_id: string
  },
  void, // return type
  'reply_slack_thread'
>

export type SendPullRequestSummaries = BullMQJob<
  null,
  void, // return type
  'send_pull_request_summaries'
>

export type SendPullRequestSummariesToOrganization = BullMQJob<
  {
    organization: {
      id: number
      slack_access_token: string
      ext_slack_webhook_channel_id: string
      send_pull_request_summaries_interval: string
      send_pull_request_summaries_day: string
      send_pull_request_summaries_time: string
    }
  },
  void, // return type
  'send_pull_request_summaries_to_organization'
>

export type CreateTrelloTaskFromSlack = BullMQJob<
  {
    team_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
  },
  void, // return type
  'create_trello_task_from_slack'
>

export type ImportGitlabProjects = BullMQJob<
  {
    organization: {
      id: number
      gitlab_access_token: string
      gitlab_webhook_secret: string
    }
  },
  void, // return type
  'import_gitlab_projects'
>

export type ImportGitlabMergeRequests = BullMQJob<
  {
    project: {
      id: number
      ext_gitlab_project_id: number
    }
    organization: {
      id: number
      gitlab_access_token: string
      trello_access_token: string | null
    }
  },
  void, // return type
  'import_gitlab_merge_requests'
>

export type SaveMergedMergeRequest = BullMQJob<
  {
    merge_request: {
      created_at: string
      id: number
      iid: number
      title: string
      target_project_id: number
      author_id: number
      description: string | null
      merged_at?: string
    }
    organization: {
      id: number
      has_unlimited_usage: boolean | null
      pr_limit_per_month: number | null
      gitlab_access_token: string
      trello_access_token: string | null
    }
  },
  void, // return type
  'save_merged_merge_request'
>

export type GenerateOpenMergeRequestSummary = BullMQJob<
  {
    merge_request: {
      created_at: string
      id: number
      iid: number
      title: string
      target_project_id: number
      author_id: number
      description: string | null
      merged_at?: string
    }
    organization: {
      id: number
      has_unlimited_usage: boolean | null
      pr_limit_per_month: number | null
      gitlab_access_token: string
      trello_access_token: string | null
    }
  },
  void, // return type
  'generate_open_merge_request_summary'
>

export type SaveOpenedMergeRequest = BullMQJob<
  {
    merge_request: {
      created_at: string
      id: number
      iid: number
      title: string
      target_project_id: number
      author_id: number
      description?: string
      merged_at?: string
    }
    organization: {
      id: number
      has_unlimited_usage: boolean | null
      pr_limit_per_month: number | null
      gitlab_access_token: string
    }
  },
  void, // return type
  'save_opened_merge_request'
>

export type RefreshGitlabTokens = BullMQJob<
  null,
  void, // return type
  'refresh_gitlab_tokens'
>

export type DispatchDebouncedJob = BullMQJob<
  {
    job: {
      name: Job['name']
      data: Job['data']
      opts?: JobsOptions
    }
    debounce: {
      key: string
      id: string
      delaySecs: number
    }
  },
  void, // return type
  'dispatch_debounced_job'
>

export type Job =
  | CreateGithubIssueFromSlack
  | AskSlackSelectGithubRepoForIssue
  | ImportPullRequests
  | SaveOpenedPullRequest
  | SaveMergedPullRequest
  | CloseLinkedTasks
  | GenerateOpenPullRequestSummary
  | ReplySlackMention
  | ReplySlackThread
  | SendPullRequestSummaries
  | SendPullRequestSummariesToOrganization
  | CreateTrelloTaskFromSlack
  | ImportGitlabProjects
  | ImportGitlabMergeRequests
  | SaveMergedMergeRequest
  | GenerateOpenMergeRequestSummary
  | SaveOpenedMergeRequest
  | RefreshGitlabTokens
  | DispatchDebouncedJob
