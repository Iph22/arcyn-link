'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useSocket } from '@/lib/socket-context'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/dashboard/sidebar'
import { ChatArea } from '@/components/dashboard/chat-area'
import { AISummaryPanel } from '@/components/dashboard/ai-summary-panel'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const { toast } = useToast()
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  // Fetch channels for user's team
  const { data: channelsData, refetch: refetchChannels } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await api.get('/channels')
      return response.data
    },
    enabled: !!user,
  })

  // Fetch selected channel data
  const { data: channelData, refetch: refetchChannel } = useQuery({
    queryKey: ['channel', selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return null
      const response = await api.get(`/channels/${selectedChannelId}`)
      return response.data
    },
    enabled: !!selectedChannelId,
  })

  // Auto-select first channel
  useEffect(() => {
    if (channelsData?.channels?.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channelsData.channels[0].id)
    }
  }, [channelsData, selectedChannelId])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: any) => {
      if (message.channelId === selectedChannelId) {
        refetchChannel()
      }
    }

    const handleReactionAdded = () => {
      refetchChannel()
    }

    const handleReactionRemoved = () => {
      refetchChannel()
    }

    const handleAISummaryNew = (data: any) => {
      toast({
        title: "AI Summary Ready",
        description: "A new AI summary has been generated for the thread.",
      })
      refetchChannel()
    }

    socket.on('message:new', handleNewMessage)
    socket.on('reaction:added', handleReactionAdded)
    socket.on('reaction:removed', handleReactionRemoved)
    socket.on('ai:summary:new', handleAISummaryNew)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('reaction:added', handleReactionAdded)
      socket.off('reaction:removed', handleReactionRemoved)
      socket.off('ai:summary:new', handleAISummaryNew)
    }
  }, [socket, selectedChannelId, refetchChannel, toast])

  // Join channel when selected
  useEffect(() => {
    if (socket && selectedChannelId) {
      socket.emit('channel:join', selectedChannelId)
    }
  }, [socket, selectedChannelId])

  if (!user) {
    return null
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        channels={channelsData?.channels || []}
        selectedChannelId={selectedChannelId}
        onChannelSelect={setSelectedChannelId}
        onRefreshChannels={refetchChannels}
        isConnected={isConnected}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        <ChatArea
          channel={channelData?.channel}
          selectedThreadId={selectedThreadId}
          onThreadSelect={setSelectedThreadId}
          onRefreshChannel={refetchChannel}
        />

        {/* AI Summary Panel */}
        {selectedThreadId && (
          <AISummaryPanel
            threadId={selectedThreadId}
            onClose={() => setSelectedThreadId(null)}
          />
        )}
      </div>
    </div>
  )
}
