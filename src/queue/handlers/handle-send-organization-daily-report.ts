import { dbClient } from '@/database/client'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { storage } from '@/lib/storage'
import { taskStatus } from '@/lib/tasks'

import { generateRepositoryContributionDiagram } from '@/lib/daily-report/generate-repo-contribution-diagram'
import { getAssignedTasks } from '@/lib/daily-report/get-assigned-tasks'
import { getDailyReportSummaryBlocks } from '@/lib/daily-report/get-daily-report-summary-blocks'
import { getDailyReportPullRequestBlocks } from '@/lib/daily-report/get-daily-report-pull-request-blocks'
import { getDailyReportTaskBlocks } from '@/lib/daily-report/get-daily-report-task-blocks'
import { getDailyReportHomieHintsBlocks } from '@/lib/daily-report/get-daily-report-homie-hints-blocks'
import { SendOrganizationDailyReport } from '@/queue/jobs'
import { subHours } from 'date-fns'

export async function handleSendOrganizationDailyReport(
  job: SendOrganizationDailyReport,
) {
  const { organization } = job.data

  const yesterday = subHours(new Date(), 24)

  const githubRepos = await dbClient
    .selectFrom('github.repo')
    .select(['name', 'id as github_repo_id', 'html_url as url'])
    .where('github.repo.organization_id', '=', organization.id)
    .execute()

  const gitlabProjects = await dbClient
    .selectFrom('gitlab.project')
    .select(['name', 'id as gitlab_project_id', 'web_url as url'])
    .where('gitlab.project.organization_id', '=', organization.id)
    .execute()

  const repos = [...githubRepos, ...gitlabProjects]

  const reposWithPullRequests = await Promise.all(
    repos.map(async (repo) => {
      let pullRequestsQuery = dbClient
        .selectFrom('homie.pull_request')
        .where('merged_at', 'is not', null)
        // .where('merged_at', '>', yesterday)
        // Only send PRs merged to default branch
        .where((eb) =>
          eb('homie.pull_request.was_merged_to_default_branch', '=', true)
            // Assume no target_branch (legacy) to be default branch, which were the only PRs saved.
            .or('homie.pull_request.target_branch', 'is', null),
        )
        .select([
          'homie.pull_request.html_url',
          'homie.pull_request.title',
          'homie.pull_request.contributor_id',
        ])
        .orderBy('merged_at')

      if ('github_repo_id' in repo) {
        pullRequestsQuery = pullRequestsQuery.where(
          'github_repo_id',
          '=',
          repo.github_repo_id,
        )
      }

      if ('gitlab_project_id' in repo) {
        pullRequestsQuery = pullRequestsQuery.where(
          'gitlab_project_id',
          '=',
          repo.gitlab_project_id,
        )
      }

      const pullRequests = await pullRequestsQuery.execute()

      return {
        name: repo.name,
        url: repo.url,
        pullRequests,
      }
    }),
  )

  let numPullRequests = 0
  let diagram = `pie`
  const contributors: Record<
    number,
    {
      id: number
      username: string
      ext_slack_member_id: string | null
    }
  > = {}

  for (const repo of reposWithPullRequests) {
    if (repo.pullRequests.length === 0) {
      continue
    }

    diagram += `\n  "${repo.name}" : ${repo.pullRequests.length}`
    numPullRequests += repo.pullRequests.length

    for (const pullRequest of repo.pullRequests) {
      const contributor = await dbClient
        .selectFrom('homie.contributor')
        .where('organization_id', '=', organization.id)
        .where('id', '=', pullRequest.contributor_id)
        .select(['username', 'ext_slack_member_id', 'id'])
        .executeTakeFirst()

      if (!contributor) {
        continue
      }

      contributors[pullRequest.contributor_id] = contributor
    }
  }

  const numContributors = Object.keys(contributors).length

  const  repositoryContributionChartFile =
    await generateRepositoryContributionDiagram({
      mermaidDiagram: diagram,
    })

  const addedTasks = await dbClient
    .selectFrom('homie.task')
    .where('organization_id', '=', organization.id)
    // .where('created_at', '>', yesterday)
    .where('task_status_id', '=', taskStatus.open)
    .select(['name', 'html_url'])
    .execute()

  const completedTasks = await dbClient
    .selectFrom('homie.task')
    .where('organization_id', '=', organization.id)
    // .where('completed_at', '>', yesterday)
    .select(['name', 'html_url'])
    .execute()

  const taskAssignments = await dbClient
    .selectFrom('homie.contributor_task')
    .innerJoin('homie.task', 'homie.contributor_task.task_id', 'homie.task.id')
    .where('homie.task.organization_id', '=', organization.id)
    .select([
      'name',
      'html_url',
      'homie.contributor_task.contributor_id as assigned_contributor_id',
      'homie.task.id as task_id',
    ])
    // .where('homie.contributor_task.created_at', '>', yesterday)
    .execute()

  const assignedTasks = await getAssignedTasks({
    taskAssignments,
    contributors,
  })

  const numAssignedTasks = Object.keys(assignedTasks).length

  const pendingTasks = await dbClient
    .selectFrom('homie.task')
    .where('task_status_id', '=', taskStatus.open)
    .where('homie.task.organization_id', '=', organization.id)
    .select(['name', 'html_url'])
    .execute()

  const slackClient = createSlackClient(organization.slack_access_token)

  // Summary
  const res = await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    blocks: getDailyReportSummaryBlocks({
      numAssignedTasks,
      numPullRequests,
      numContributors,
      addedTasks,
      completedTasks,
      pendingTasks,
    }),
  })

  // Pull Requests
  await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    thread_ts: res.ts,
    blocks: await getDailyReportPullRequestBlocks({
      contributors,
      repositoryContributionChartFile,
      repos: reposWithPullRequests,
    }),
  })

  // Tasks
  await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    thread_ts: res.ts,
    blocks: await getDailyReportTaskBlocks({
      addedTasks,
      completedTasks,
      taskAssignments,
      assignedTasks,
    }),
  })

  // Homie hints
  await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    thread_ts: res.ts,
    blocks: await getDailyReportHomieHintsBlocks({
      addedTasks,
      pendingTasks,
      pullRequests: reposWithPullRequests.flatMap((repo) => repo.pullRequests),
      contributors: Object.values(contributors),
      extSlackBotUserId: organization.ext_slack_bot_user_id,
    }),
  })
}
