'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './supabase-auth-context'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Channel } from '@/types/channel'

interface Message {
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

interface RealtimeContextType {
  messages: Message[]
  channels: Channel[]
  activeChannel: string | null
  setActiveChannel: (channelId: string) => void
  sendMessage: (content: string, channelId: string) => Promise<void>
  createChannel: (name: string, team: string) => Promise<void>
  refreshChannels: () => Promise<void>
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)
  
  const { user, profile } = useAuth()
  const supabase = createClient()

  // Fetch channels with message counts
  const fetchChannels = useCallback(async () => {
    if (!profile) return

    try {
      // First, get channels
      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .eq('team', profile.team)
        .order('created_at', { ascending: true })

      if (channelsError) throw channelsError

      // Then get message counts for each channel
      const channelsWithCounts = await Promise.all(
        (channelsData || []).map(async (channel) => {
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id)

          return {
            ...channel,
            isPrivate: channel.is_private ?? false,
            _count: {
              messages: messageCount || 0,
              channelUsers: 0 // You can add a similar query for channel users if needed
            }
          }
        })
      )

      setChannels(channelsWithCounts)
      
      // Set first channel as active if none selected
      if (channelsWithCounts && channelsWithCounts.length > 0 && !activeChannel) {
        setActiveChannel(channelsWithCounts[0].id)
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }, [profile, activeChannel])

  // Fetch messages for active channel
  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user_profiles (
            username,
            avatar,
            team
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [])

  // Setup realtime subscription
  useEffect(() => {
    if (!user || !activeChannel) return

    // Clean up previous subscription
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
    }

    // Create new subscription
    const channel = supabase
      .channel(`messages:${activeChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel}`,
        },
        (payload) => {
          console.log('New message received:', payload)
          // Fetch the complete message with user profile
          fetchMessages(activeChannel)
          // Also refresh channels to update message count
          fetchChannels()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel}`,
        },
        (payload) => {
          console.log('Message updated:', payload)
          fetchMessages(activeChannel)
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    setRealtimeChannel(channel)

    // Fetch initial messages
    fetchMessages(activeChannel)

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user, activeChannel, fetchMessages, fetchChannels])

  // Fetch channels when user/profile changes
  useEffect(() => {
    if (profile) {
      fetchChannels()
    }
  }, [profile, fetchChannels])

  const sendMessage = async (content: string, channelId: string) => {
    if (!user || !content.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          channel_id: channelId,
          user_id: user.id,
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const createChannel = async (name: string, team: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name,
          team,
          is_private: false,
        })
        .select()
        .single()

      if (error) throw error
      
      // Refresh channels
      await fetchChannels()
      
      // Set new channel as active
      if (data) {
        setActiveChannel(data.id)
      }
    } catch (error) {
      console.error('Error creating channel:', error)
      throw error
    }
  }

  return (
    <RealtimeContext.Provider
      value={{
        messages,
        channels,
        activeChannel,
        setActiveChannel,
        sendMessage,
        createChannel,
        refreshChannels: fetchChannels,
        isConnected,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}