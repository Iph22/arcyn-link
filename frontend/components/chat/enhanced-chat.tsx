'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRealtime } from '@/lib/supabase-realtime-context'
import { useAuth } from '@/lib/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { 
  FileText, 
  Upload, 
  Bot, 
  Sparkles, 
  BarChart3, 
  Loader2,
  X 
} from 'lucide-react'

interface Message {
  id: string
  content: string
  user_id: string
  channel_id: string
  message_type?: 'user_message' | 'ai_response' | 'ai_summary' | 'ai_analysis'
  created_at: string
  user_profiles?: {
    username: string
    team: string
  }
}

export function EnhancedChat() {
  const [newMessage, setNewMessage] = useState('')
  const [isAEProcessing, setIsAEProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const { messages, activeChannel, sendMessage, isConnected } = useRealtime()
  const { user, profile } = useAuth()

  // Handle A.E triggers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel || !user) return

    const messageContent = newMessage.trim()
    
    try {
      // Check for A.E triggers
      if (messageContent.includes('@A.E') || messageContent.startsWith('/ae')) {
        await handleAETrigger(messageContent)
      } else {
        // Regular message
        await sendMessage(messageContent, activeChannel)
      }
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Handle A.E triggers
  const handleAETrigger = async (message: string) => {
    if (!activeChannel || !user) return

    setIsAEProcessing(true)

    try {
      // Send the user's message first
      await sendMessage(message, activeChannel)

      // Determine A.E action
      if (message.includes('/ae summarize') || message.includes('@A.E summarize')) {
        await callAESummary()
      } else {
        // Regular A.E chat response
        await callAEResponse(message)
      }
    } catch (error) {
      console.error('A.E processing error:', error)
    } finally {
      setIsAEProcessing(false)
    }
  }

  // Call A.E chat response API
  const callAEResponse = async (message: string) => {
    try {
      const response = await fetch('/api/arcyn-eye', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannel,
          message,
          userId: user?.id
        })
      })

      if (!response.ok) {
        throw new Error('A.E response failed')
      }

      // The API will insert the message directly into Supabase
      // Realtime will handle updating the UI
    } catch (error) {
      console.error('A.E response error:', error)
    }
  }

  // Call A.E summary API
  const callAESummary = async () => {
    try {
      const response = await fetch('/api/arcyn-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannel,
          userId: user?.id
        })
      })

      if (!response.ok) {
        throw new Error('A.E summary failed')
      }

      // The API will insert the summary message directly into Supabase
    } catch (error) {
      console.error('A.E summary error:', error)
    }
  }

  // Handle file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  })

  // Handle file analysis
  const handleFileAnalysis = async () => {
    if (!uploadedFile || !activeChannel || !user) return

    setIsAEProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('channelId', activeChannel)
      formData.append('userId', user.id)

      const response = await fetch('/api/arcyn-analyze', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('File analysis failed')
      }

      setUploadedFile(null)
      // The API will insert the analysis message directly into Supabase
    } catch (error) {
      console.error('File analysis error:', error)
    } finally {
      setIsAEProcessing(false)
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
  }

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'ARCYN_X':
        return 'text-arcyn-gold'
      case 'MODULEX':
        return 'text-arcyn-soft-gold'
      case 'NEXALAB':
        return 'text-arcyn-gold'
      default:
        return 'text-arcyn-subtext'
    }
  }

  const getMessageStyle = (message: Message) => {
    if (message.user_id === 'arcyn_eye') {
      return {
        container: 'bg-gradient-to-r from-arcyn-graphite to-arcyn-matte-grey border border-arcyn-gold/30 rounded-lg p-3 shadow-gold-glow',
        avatar: 'bg-gradient-to-r from-arcyn-gold to-arcyn-soft-gold shadow-[0_0_15px_rgba(255,215,0,0.5)]',
        username: 'text-arcyn-gold font-semibold'
      }
    }
    return {
      container: '',
      avatar: 'bg-gradient-to-r from-arcyn-gold to-arcyn-soft-gold',
      username: getTeamColor(message.user_profiles?.team || '')
    }
  }

  const getAvatarContent = (message: Message) => {
    if (message.user_id === 'arcyn_eye') {
      return <Bot className="w-4 h-4" />
    }
    return message.user_profiles?.username?.charAt(0).toUpperCase() || 'U'
  }

  const getMessageTypeIcon = (messageType?: string) => {
    switch (messageType) {
      case 'ai_summary':
        return <BarChart3 className="w-4 h-4 text-arcyn-gold" />
      case 'ai_analysis':
        return <FileText className="w-4 h-4 text-arcyn-gold" />
      case 'ai_response':
        return <Sparkles className="w-4 h-4 text-arcyn-gold" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-arcyn-black">
      {/* Header */}
      <div className="p-4 border-b border-arcyn-matte-grey">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-arcyn-text">
            {activeChannel ? `Channel Chat` : 'No Channel Selected'}
          </h2>
          <div className="flex items-center space-x-4">
            {isAEProcessing && (
              <div className="flex items-center space-x-2 text-arcyn-gold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">A.E Processing...</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-arcyn-subtext">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message: Message) => {
            const styles = getMessageStyle(message)
            return (
              <div key={message.id} className={`flex items-start space-x-3 ${styles.container}`}>
                <Avatar className="w-8 h-8">
                  <div className={`w-full h-full ${styles.avatar} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                    {getAvatarContent(message)}
                  </div>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${styles.username}`}>
                      {message.user_id === 'arcyn_eye' ? 'Arcyn Eye' : (message.user_profiles?.username || 'Unknown User')}
                    </span>
                    {getMessageTypeIcon(message.message_type)}
                    <span className="text-xs text-arcyn-subtext">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-arcyn-text mt-1 break-words whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            )
          })}
          {messages.length === 0 && (
            <div className="text-center text-arcyn-subtext py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-arcyn-gold/50" />
              <p>No messages yet. Start the conversation!</p>
              <p className="text-sm mt-2">Try mentioning <span className="text-arcyn-gold">@A.E</span> or use <span className="text-arcyn-gold">/ae</span> commands</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* File Upload Area */}
      {activeChannel && (
        <div className="p-4 border-t border-arcyn-matte-grey">
          {/* File Drop Zone */}
          {!uploadedFile && (
            <div
              {...getRootProps()}
              className={`mb-4 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-arcyn-gold bg-arcyn-gold/10' 
                  : 'border-arcyn-matte-grey hover:border-arcyn-soft-gold'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-arcyn-subtext" />
                <p className="text-sm text-arcyn-subtext">
                  {isDragActive 
                    ? 'Drop file here for A.E analysis...' 
                    : 'Drag & drop a file for A.E analysis, or click to select'
                  }
                </p>
                <p className="text-xs text-arcyn-subtext mt-1">
                  Supports PDF, TXT files
                </p>
              </div>
            </div>
          )}

          {/* Uploaded File Preview */}
          {uploadedFile && (
            <div className="mb-4 p-3 bg-arcyn-graphite rounded-lg border border-arcyn-matte-grey">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-arcyn-gold" />
                  <span className="text-sm text-arcyn-text">{uploadedFile.name}</span>
                  <span className="text-xs text-arcyn-subtext">
                    ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleFileAnalysis}
                    disabled={isAEProcessing}
                    size="sm"
                    className="bg-arcyn-gold hover:bg-arcyn-soft-gold text-arcyn-black"
                  >
                    {isAEProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-1" />
                        Analyze
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={removeUploadedFile}
                    size="sm"
                    variant="outline"
                    className="border-arcyn-matte-grey text-arcyn-subtext hover:text-arcyn-text"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message as ${profile?.username || 'User'}... (Try @A.E or /ae commands)`}
              className="flex-1 bg-arcyn-matte-grey border-arcyn-matte-grey text-arcyn-text placeholder:text-arcyn-subtext focus:border-arcyn-gold"
              disabled={!isConnected || isAEProcessing}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || !isConnected || isAEProcessing}
              className="bg-arcyn-gold hover:bg-arcyn-soft-gold text-arcyn-black"
            >
              Send
            </Button>
          </form>

          {/* A.E Commands Help */}
          <div className="mt-2 text-xs text-arcyn-subtext">
            <span className="font-medium text-arcyn-gold">A.E Commands:</span> @A.E [question] • /ae summarize • Upload files for analysis
          </div>
        </div>
      )}
    </div>
  )
}
