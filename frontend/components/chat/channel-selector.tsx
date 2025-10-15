'use client'

import { useState } from 'react'
import { useRealtime } from '@/lib/supabase-realtime-context'
import { useAuth } from '@/lib/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Hash } from 'lucide-react'

export function ChannelSelector() {
  const [newChannelName, setNewChannelName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { channels, activeChannel, setActiveChannel, createChannel } = useRealtime()
  const { profile } = useAuth()

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim() || !profile?.team) return

    setIsCreating(true)
    try {
      await createChannel(newChannelName.trim(), profile.team)
      setNewChannelName('')
    } catch (error) {
      console.error('Error creating channel:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'ARCYN_X':
        return 'border-l-cyan-500 bg-cyan-500/10'
      case 'MODULEX':
        return 'border-l-violet-500 bg-violet-500/10'
      case 'NEXALAB':
        return 'border-l-emerald-500 bg-emerald-500/10'
      default:
        return 'border-l-gray-500 bg-gray-500/10'
    }
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Channels</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Channel</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateChannel} className="space-y-4">
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Channel name"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="submit"
                    disabled={!newChannelName.trim() || isCreating}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {profile && (
          <p className="text-sm text-gray-400 mt-1">
            Team: <span className="font-medium">{profile.team}</span>
          </p>
        )}
      </div>

      {/* Channel List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`w-full text-left p-3 rounded-lg border-l-4 transition-all ${
                activeChannel === channel.id
                  ? `${getTeamColor(channel.team)} text-white`
                  : 'border-l-transparent hover:bg-gray-700 text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4" />
                <span className="font-medium">{channel.name}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {channel.team}
              </p>
            </button>
          ))}
          {channels.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No channels available</p>
              <p className="text-xs mt-1">Create one to get started!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
