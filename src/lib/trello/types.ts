export interface TrelloBoard {
  id: string
  name: string
}

export interface TrelloList {
  id: string
  name: string
}

export interface TrelloCard {
  id: string
  shortUrl: string
  name: string
  /**
   * Description field
   */
  desc: string
}

export interface TrelloWebhook {
  id: string
  description: string
  idModel: string
  callbackURL: string
  active: boolean
  consecutiveFailures: number
}

export interface TrelloMember {
  id: string
  username: string
  fullName: string
}
