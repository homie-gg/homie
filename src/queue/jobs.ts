import { GithubOrganization } from '@/lib/db/types'
import { Job as BullMQJob } from 'bullmq'
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

export type GenerateOpenPullRequestSummary = BullMQJob<
  {
    pull_request: PullRequest
    installation: InstallationLite | undefined
  },
  void, // return type
  'generate_open_pull_request_summary'
>

export type AnswerSlackQuestion = BullMQJob<
  {
    team_id: string
    channel_id: string
    target_message_ts: string
    text: string
  },
  void, // return type
  'answer_slack_question'
>

export type Job =
  | CreateGithubIssueFromSlack
  | AskSlackSelectGithubRepoForIssue
  | ImportPullRequests
  | SaveOpenedPullRequest
  | SaveMergedPullRequest
  | GenerateOpenPullRequestSummary
  | AnswerSlackQuestion
