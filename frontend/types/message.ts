export interface Message {
  id: string
  content: string
  channel_id: string
  user_id: string
  created_at: string
  user_profiles?: {
    username: string
    avatar?: string
    team: string
  }
}