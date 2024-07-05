import { GithubOrganization } from '@/database/types'
import { Job as BullMQJob, JobsOptions } from 'bullmq'
import {
  PullRequest,
  InstallationLite,
  Repository,
  Issue,
} from '@octokit/webhooks-types'

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

export type CreateHomieTaskFromGithubIssue = BullMQJob<
  {
    issue: {
      id: number
      number: number
      title: string
      body?: string | null
      user?: {
        id: number
        login?: string
      } | null
      html_url: string
      assignees?:
        | null
        | {
            login?: string | null
            id: number
          }[]
    }
    installation?: {
      id: number
    }
    repository: {
      name: string
      full_name: string
      html_url: string
      id: number
    }
  },
  void, // return type
  'create_homie_task_from_github_issue'
>

export type UpdateHomieTaskFromGithubIssue = BullMQJob<
  {
    issue: Issue
    installation: InstallationLite | undefined
    repository: Repository
  },
  void, // return type
  'update_homie_task_from_github_issue'
>

export type ImportPullRequests = BullMQJob<
  {
    github_organization: GithubOrganization
  },
  void, // return type
  'import_pull_requests'
>

export type ImportGithubIssues = BullMQJob<
  {
    github_organization: GithubOrganization
  },
  void, // return type
  'import_github_issues'
>

export type SaveOpenedPullRequest = BullMQJob<
  {
    pull_request: PullRequest
    installation: InstallationLite | undefined
  },
  void, // return type
  'save_opened_pull_request'
>

export type ClosePullRequest = BullMQJob<
  {
    pull_request: {
      user: {
        id: number
        login: string
      }
      merged_at: string | null
      body: string | null
      id: number
      title: string
      number: number
      created_at: string
      base: {
        repo: {
          id: number
          name: string
          full_name: string
          html_url: string
          default_branch: string
        }
        ref: string
      }
      html_url: string
    }
    installation?: {
      id: number
    }
  },
  void, // return type
  'close_pull_request'
>

export type ReopenPullRequest = BullMQJob<
  {
    pull_request: {
      user: {
        id: number
        login: string
      }
      merged_at: string | null
      body: string | null
      id: number
      title: string
      number: number
      created_at: string
      base: {
        repo: {
          id: number
          name: string
          full_name: string
          html_url: string
          default_branch: string
        }
        ref: string
      }
      html_url: string
    }
    installation?: {
      id: number
    }
  },
  void, // return type
  'reopen_pull_request'
>

export type SaveMergedPullRequest = BullMQJob<
  {
    pull_request: {
      user: {
        id: number
        login: string
      }
      merged_at: string | null
      body: string | null
      id: number
      title: string
      number: number
      created_at: string
      base: {
        repo: {
          id: number
          name: string
          full_name: string
          html_url: string
          default_branch: string
        }
        ref: string
      }
      html_url: string
    }
    installation?: {
      id: number
    }
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

export type CreateHomieTaskFromTrelloTask = BullMQJob<
  {
    board: {
      id: string
    }
    card: {
      id: string
      idList?: string
      shortLink: string
      name: string
    }
  },
  void, // return type
  'create_homie_task_from_trello_task'
>

export type UpdateHomieTaskFromTrelloTask = BullMQJob<
  {
    board: {
      id: string
    }
    card: {
      id: string
      idList?: string
      shortLink: string
      name: string
      desc?: string
      due?: string
      closed?: boolean
    }
    updated_fields: Array<'name' | 'desc' | 'due'>
  },
  void, // return type
  'update_homie_task_from_trello_task'
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
      asana_access_token: string | null
      has_unlimited_usage: boolean | null
    }
  },
  void, // return type
  'import_gitlab_merge_requests'
>

export type ReopenMergeRequest = BullMQJob<
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
      gitlab_access_token: string
      trello_access_token: string | null
      asana_access_token: string | null
    }
  },
  void, // return type
  'reopen_merge_request'
>

export type CloseMergeRequest = BullMQJob<
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
      gitlab_access_token: string
      trello_access_token: string | null
      asana_access_token: string | null
    }
  },
  void, // return type
  'close_merge_request'
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
      gitlab_access_token: string
      trello_access_token: string | null
      asana_access_token: string | null
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
      gitlab_access_token: string
      trello_access_token: string | null
      asana_access_token: string | null
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

export type ImportAsanaProjects = BullMQJob<
  {
    organization: {
      id: number
      asana_access_token: string
    }
  },
  void,
  'import_asana_projects'
>

export type ImportAsanaTasks = BullMQJob<
  {
    organization: {
      id: number
      asana_access_token: string
    }
    project: {
      id: number
      ext_asana_project_id: string
    }
  },
  void,
  'import_asana_tasks'
>

export type RefreshAsanaTokens = BullMQJob<
  null,
  void, // return type
  'refresh_asana_tokens'
>

export type CreateAsanaTaskFromSlack = BullMQJob<
  {
    team_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
    project_id: string | null
  },
  void, // return type
  'create_asana_task_from_slack'
>

export type SyncAsanaTaskToHomieTask = BullMQJob<
  {
    ext_asana_task_id: string
    project_id: number
  },
  void,
  'sync_asana_task_to_homie_task'
>

export type AskSlackSelectAsanaProjectForTask = BullMQJob<
  {
    team_id: string
    trigger_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
  },
  void, // return type
  'ask_slack_select_asana_project_for_task'
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
  | CreateHomieTaskFromGithubIssue
  | UpdateHomieTaskFromGithubIssue
  | AskSlackSelectGithubRepoForIssue
  | ImportPullRequests
  | ImportGithubIssues
  | SaveOpenedPullRequest
  | SaveMergedPullRequest
  | ClosePullRequest
  | ReopenPullRequest
  | CloseLinkedTasks
  | GenerateOpenPullRequestSummary
  | ReplySlackMention
  | SendPullRequestSummaries
  | SendPullRequestSummariesToOrganization
  | CreateTrelloTaskFromSlack
  | CreateHomieTaskFromTrelloTask
  | UpdateHomieTaskFromTrelloTask
  | ImportGitlabProjects
  | ImportGitlabMergeRequests
  | ReopenMergeRequest
  | CloseMergeRequest
  | SaveMergedMergeRequest
  | GenerateOpenMergeRequestSummary
  | SaveOpenedMergeRequest
  | RefreshGitlabTokens
  | ImportAsanaProjects
  | ImportAsanaTasks
  | AskSlackSelectAsanaProjectForTask
  | CreateAsanaTaskFromSlack
  | RefreshAsanaTokens
  | SyncAsanaTaskToHomieTask
  | DispatchDebouncedJob
