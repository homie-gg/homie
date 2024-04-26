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
