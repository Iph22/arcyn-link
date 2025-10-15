'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/supabase-auth-context'
import { useRealtime } from '@/lib/supabase-realtime-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { ChatArea } from '@/components/dashboard/chat-area'
import { AISummaryPanel } from '@/components/dashboard/ai-summary-panel'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { 
    messages, 
    channels, 
    activeChannel, 
    setActiveChannel, 
    sendMessage, 
    createChannel, 
    isConnected 
  } = useRealtime()
  const { toast } = useToast()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  if (!user) {
    return null
  }

  const currentChannel = channels.find(c => c.id === activeChannel)

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        channels={channels}
        selectedChannelId={activeChannel}
        onChannelSelect={setActiveChannel}
        onCreateChannel={createChannel}
        isConnected={isConnected}
        userTeam={profile?.team}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        <ChatArea
          channel={currentChannel}
          messages={messages}
          selectedThreadId={selectedThreadId}
          onThreadSelect={setSelectedThreadId}
          onSendMessage={sendMessage}
          currentUser={user}
          userProfile={profile}
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
