export interface Message {
  type: 'human' | 'bot'
  text: string
  ts: string
}
