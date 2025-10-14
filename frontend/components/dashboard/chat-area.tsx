'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useSocket } from '@/lib/socket-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatTime, generateAvatar } from '@/lib/utils'
import { 
  Send, 
  Hash, 
  MessageSquare, 
  Smile,
  MoreHorizontal,
  Brain
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  reactions: Array<{
    id: string
    emoji: string
    user: {
      id: string
      username: string
    }
  }>
}

interface Thread {
  id: string
  title?: string
  messages: Message[]
  summaries: Array<{
    id: string
    content: string
    createdAt: string
  }>
}

interface Channel {
  id: string
  name: string
  description?: string
  messages: Message[]
  threads: Thread[]
}

interface ChatAreaProps {
  channel: Channel | null
  selectedThreadId: string | null
  onThreadSelect: (threadId: string | null) => void
  onRefreshChannel: () => void
}

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀']

export function ChatArea({
  channel,
  selectedThreadId,
  onThreadSelect,
  onRefreshChannel
}: ChatAreaProps) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const selectedThread = channel?.threads?.find(t => t.id === selectedThreadId)
  const displayMessages = selectedThread ? selectedThread.messages : channel?.messages || []

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])

  // Socket event handlers for typing
  useEffect(() => {
    if (!socket) return

    const handleTypingStart = (data: { userId: string; username: string; channelId: string }) => {
      if (data.channelId === channel?.id && data.userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username])
      }
    }

    const handleTypingStop = (data: { userId: string; channelId: string }) => {
      if (data.channelId === channel?.id && data.userId !== user?.id) {
        setTypingUsers(prev => prev.filter(u => u !== data.userId))
      }
    }

    socket.on('typing:start', handleTypingStart)
    socket.on('typing:stop', handleTypingStop)

    return () => {
      socket.off('typing:start', handleTypingStart)
      socket.off('typing:stop', handleTypingStop)
    }
  }, [socket, channel?.id, user?.id])

  const handleSendMessage = () => {
    if (!message.trim() || !socket || !channel) return

    socket.emit('message:send', {
      content: message.trim(),
      channelId: channel.id,
      threadId: selectedThreadId
    })

    setMessage('')
    handleStopTyping()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleStartTyping = () => {
    if (!socket || !channel || isTyping) return

    setIsTyping(true)
    socket.emit('typing:start', { channelId: channel.id })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 3000)
  }

  const handleStopTyping = () => {
    if (!socket || !channel || !isTyping) return

    setIsTyping(false)
    socket.emit('typing:stop', { channelId: channel.id })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleReaction = (messageId: string, emoji: string) => {
    if (!socket) return

    socket.emit('reaction:add', {
      messageId,
      emoji
    })
  }

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Select a channel
          </h3>
          <p className="text-gray-500">
            Choose a channel from the sidebar to start chatting
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedThread ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onThreadSelect(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ← Back
                </Button>
                <MessageSquare className="w-5 h-5 text-violet-500" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedThread.title || 'Thread'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedThread.messages.length} messages
                  </p>
                </div>
              </>
            ) : (
              <>
                <Hash className="w-5 h-5 text-cyan-500" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {channel.name}
                  </h2>
                  {channel.description && (
                    <p className="text-sm text-gray-400">
                      {channel.description}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {selectedThread && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onThreadSelect(selectedThread.id)}
              className="text-violet-400 border-violet-400 hover:bg-violet-400/10"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Summary
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {displayMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="group"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className={`${generateAvatar(msg.user.username)} text-white text-sm font-semibold`}>
                      {msg.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-white">
                        {msg.user.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    
                    <div className="text-gray-300 break-words">
                      {msg.content}
                    </div>

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(
                          msg.reactions.reduce((acc, reaction) => {
                            acc[reaction.emoji] = acc[reaction.emoji] || []
                            acc[reaction.emoji].push(reaction.user.username)
                            return acc
                          }, {} as Record<string, string[]>)
                        ).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs transition-colors"
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-300">{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick reactions (show on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                      <div className="flex space-x-1">
                        {commonEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-gray-400 text-sm"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (e.target.value && !isTyping) {
                  handleStartTyping()
                } else if (!e.target.value && isTyping) {
                  handleStopTyping()
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${selectedThread ? 'thread' : `#${channel.name}`}`}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500 pr-12"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            variant="gradient"
            size="sm"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
