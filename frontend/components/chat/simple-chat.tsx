'use client'

import { useState } from 'react'
import { useRealtime } from '@/lib/supabase-realtime-context'
import { useAuth } from '@/lib/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

export function SimpleChat() {
  const [newMessage, setNewMessage] = useState('')
  const { messages, activeChannel, sendMessage, isConnected } = useRealtime()
  const { user, profile } = useAuth()

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel) return

    try {
      await sendMessage(newMessage, activeChannel)
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'ARCYN_X':
        return 'text-cyan-400'
      case 'MODULEX':
        return 'text-violet-400'
      case 'NEXALAB':
        return 'text-emerald-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {activeChannel ? `Channel Chat` : 'No Channel Selected'}
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {message.user_profiles?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${getTeamColor(message.user_profiles?.team || '')}`}>
                    {message.user_profiles?.username || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-gray-300 mt-1 break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      {activeChannel && (
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message as ${profile?.username || 'User'}...`}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500"
              disabled={!isConnected}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
