import { SelectableForTable } from 'zapatos/schema'

export type Organization = SelectableForTable<'voidpm.organization'>
export type Contributor = SelectableForTable<'voidpm.contributor'>
export type Plan = SelectableForTable<'voidpm.plan'>
export type Subscription = SelectableForTable<'voidpm.plan'>

export type GithubOrganization = SelectableForTable<'github.organization'>
export type GithubPullRequest = SelectableForTable<'github.pull_request'>
export type GithubRepo = SelectableForTable<'github.repo'>

export type TrelloWorkspace = SelectableForTable<'trello.workspace'>
