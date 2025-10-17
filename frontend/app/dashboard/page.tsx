'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/lib/supabase-auth-context'
import { useRealtime } from '@/lib/supabase-realtime-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { ChatArea } from '@/components/dashboard/chat-area'
import { AISummaryPanel } from '@/components/dashboard/ai-summary-panel'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { 
    messages: supabaseMessages, 
    channels, 
    activeChannel, 
    setActiveChannel, 
    refreshChannels,
    isConnected 
  } = useRealtime()
  const { toast } = useToast()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  // Transform Supabase data to ChatArea format
  const transformedChannel = useMemo(() => {
    const currentChannel = channels.find(c => c.id === activeChannel)
    if (!currentChannel) return null

    return {
      id: currentChannel.id,
      name: currentChannel.name,
      description: currentChannel.description,
      messages: supabaseMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.created_at,
        user: {
          id: msg.user_id,
          username: msg.user_profiles?.username || 'Unknown',
          avatar: msg.user_profiles?.avatar
        },
        reactions: []
      })),
      threads: []
    }
  }, [channels, activeChannel, supabaseMessages])

  if (!user) {
    return null
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        channels={channels}
        selectedChannelId={activeChannel}
        onChannelSelect={setActiveChannel}
        onRefreshChannels={refreshChannels}
        isConnected={isConnected}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        <ChatArea
          channel={transformedChannel}
          selectedThreadId={selectedThreadId}
          onThreadSelect={setSelectedThreadId}
          onRefreshChannel={refreshChannels}
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