'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getTeamColor, getTeamName, generateAvatar } from '@/lib/utils'
import type { Channel } from '@/types/channel'
import { 
  Hash, 
  Plus, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff,
  Users,
  MessageSquare
} from 'lucide-react'
import { motion } from 'framer-motion'

interface SidebarProps {
  channels: Channel[]
  selectedChannelId: string | null
  onChannelSelect: (channelId: string) => void
  onRefreshChannels: () => void
  isConnected: boolean
}

export function Sidebar({
  channels,
  selectedChannelId,
  onChannelSelect,
  onRefreshChannels,
  isConnected
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [showCreateChannel, setShowCreateChannel] = useState(false)

  if (!user) return null

  const teamColor = getTeamColor(user.team)
  const teamName = getTeamName(user.team)

  return (
    <div className="w-80 bg-arcyn-graphite border-r border-arcyn-matte-grey flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-arcyn-matte-grey">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-arcyn-gold to-arcyn-soft-gold rounded-lg"></div>
            <span className="text-lg font-display font-bold gradient-text">
              Arcyn Link
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Team Info */}
        <div className="flex items-center space-x-3 p-3 bg-arcyn-matte-grey/50 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${teamColor.replace('text-', 'bg-')}`}></div>
          <div className="flex-1">
            <h3 className="text-arcyn-text font-semibold">{teamName}</h3>
            <p className="text-arcyn-subtext text-sm">{user.username}</p>
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-arcyn-text font-medium flex items-center">
              <Hash className="w-4 h-4 mr-1" />
              Channels
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateChannel(true)}
              className="text-arcyn-subtext hover:text-arcyn-text p-1"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-1">
              {channels.map((channel) => (
                <motion.button
                  key={channel.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onChannelSelect(channel.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    selectedChannelId === channel.id
                      ? 'bg-arcyn-gold/20 text-arcyn-gold border border-arcyn-gold/30 shadow-soft-gold-glow'
                      : 'text-arcyn-text hover:bg-arcyn-matte-grey/50 hover:text-arcyn-gold'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{channel.name}</span>
                        {channel._count.messages > 0 && (
                          <span className="text-xs bg-arcyn-matte-grey px-1.5 py-0.5 rounded-full text-arcyn-text">
                            {channel._count.messages}
                          </span>
                        )}
                      </div>
                      {channel.description && (
                        <p className="text-xs text-arcyn-subtext truncate mt-0.5">
                          {channel.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-arcyn-matte-grey">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className={`${generateAvatar(user.username)} text-arcyn-black font-semibold`}>
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-arcyn-text font-medium truncate">{user.username}</p>
            <p className="text-arcyn-subtext text-sm truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-arcyn-subtext hover:text-arcyn-text"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={logout}
            className="text-arcyn-subtext hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
