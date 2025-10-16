export interface Channel {
  id: string
  name: string
  description?: string
  team: string
  created_at: string
  isPrivate: boolean
  _count: {
    messages: number
    channelUsers: number
  }
}