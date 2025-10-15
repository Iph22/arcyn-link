'use client'

import { useAuth } from '@/lib/supabase-auth-context'
import { ChannelSelector } from '@/components/chat/channel-selector'
import { SimpleChat } from '@/components/chat/simple-chat'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function DemoPage() {
  const { user, profile, logout } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to access the demo</h1>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Arcyn Link - Supabase Demo</h1>
            <p className="text-sm text-gray-400">
              Welcome, {profile?.username || user.email} ({profile?.team || 'No Team'})
            </p>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <ChannelSelector />
        <div className="flex-1">
          <SimpleChat />
        </div>
      </div>
    </div>
  )
}
