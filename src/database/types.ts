import { SelectableForTable } from 'zapatos/schema'

export type Organization = SelectableForTable<'voidpm.organization'>
export type Contributor = SelectableForTable<'voidpm.contributor'>
export type Plan = SelectableForTable<'voidpm.plan'>
export type Subscription = SelectableForTable<'voidpm.plan'>
export type PullRequest = SelectableForTable<'voidpm.pull_request'>

export type GithubOrganization = SelectableForTable<'github.organization'>
export type GithubRepo = SelectableForTable<'github.repo'>

export type GitlabProject = SelectableForTable<'gitlab.project'>

export type TrelloWorkspace = SelectableForTable<'trello.workspace'>
