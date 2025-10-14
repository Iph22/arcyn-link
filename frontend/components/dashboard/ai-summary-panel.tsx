'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { 
  Brain, 
  X, 
  Loader2, 
  Sparkles, 
  Clock,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatTime } from '@/lib/utils'

interface AISummaryPanelProps {
  threadId: string
  onClose: () => void
}

interface Summary {
  id: string
  content: string
  createdAt: string
}

export function AISummaryPanel({ threadId, onClose }: AISummaryPanelProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch existing summaries
  const { data: summariesData, refetch: refetchSummaries } = useQuery({
    queryKey: ['summaries', threadId],
    queryFn: async () => {
      const response = await api.get(`/ai/summaries/${threadId}`)
      return response.data
    },
  })

  // Fetch latest summary
  const { data: latestSummary, refetch: refetchLatestSummary } = useQuery({
    queryKey: ['summary', threadId],
    queryFn: async () => {
      try {
        const response = await api.get(`/ai/summary/${threadId}`)
        return response.data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null // No summary exists yet
        }
        throw error
      }
    },
  })

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/summarize', { threadId })
      return response.data
    },
    onSuccess: (data) => {
      setIsGenerating(true)
      toast({
        title: "AI Summary Started",
        description: "Claude is analyzing the thread. This may take a moment...",
      })
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const jobResponse = await api.get(`/ai/job/${data.jobId}`)
          const jobData = jobResponse.data
          
          if (jobData.state === 'completed') {
            clearInterval(pollInterval)
            setIsGenerating(false)
            refetchLatestSummary()
            refetchSummaries()
            toast({
              title: "AI Summary Complete",
              description: "Claude has finished analyzing the thread.",
            })
          } else if (jobData.state === 'failed') {
            clearInterval(pollInterval)
            setIsGenerating(false)
            toast({
              title: "Summary Failed",
              description: "Failed to generate AI summary. Please try again.",
              variant: "destructive",
            })
          }
        } catch (error) {
          clearInterval(pollInterval)
          setIsGenerating(false)
          toast({
            title: "Error",
            description: "Failed to check summary status.",
            variant: "destructive",
          })
        }
      }, 2000)
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Summary",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      })
    },
  })

  const handleGenerateSummary = () => {
    generateSummaryMutation.mutate()
  }

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-violet-500" />
            <h3 className="text-lg font-semibold text-white">AI Summary</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Claude-powered insights and key takeaways
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Generate Button */}
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating || generateSummaryMutation.isPending}
              variant="gradient"
              className="w-full"
            >
              {isGenerating || generateSummaryMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>

            {/* Latest Summary */}
            {latestSummary?.summary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-violet-400">
                      Latest Summary
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(latestSummary.summary.createdAt)}
                  </div>
                </div>
                
                <div className="prose prose-sm prose-invert max-w-none">
                  <div 
                    className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: latestSummary.summary.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^## (.*$)/gm, '<h3 class="text-white font-semibold mt-4 mb-2">$1</h3>')
                        .replace(/^# (.*$)/gm, '<h2 class="text-white font-bold text-lg mt-4 mb-2">$1</h2>')
                        .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Previous Summaries */}
            {summariesData?.summaries && summariesData.summaries.length > 1 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Previous Summaries
                </h4>
                <div className="space-y-3">
                  {summariesData.summaries.slice(1).map((summary: Summary) => (
                    <motion.div
                      key={summary.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-700/50 border border-gray-600 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">
                          Summary
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTime(summary.createdAt)}
                        </div>
                      </div>
                      
                      <div 
                        className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap line-clamp-4"
                        dangerouslySetInnerHTML={{ 
                          __html: summary.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!latestSummary?.summary && !isGenerating && !generateSummaryMutation.isPending && (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-400 mb-2">
                  No Summary Yet
                </h4>
                <p className="text-gray-500 text-sm mb-4">
                  Generate an AI summary to get key insights and takeaways from this thread.
                </p>
              </div>
            )}

            {/* Loading State */}
            {(isGenerating || generateSummaryMutation.isPending) && (
              <div className="text-center py-8">
                <div className="relative">
                  <Brain className="w-12 h-12 text-violet-500 mx-auto mb-4 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-violet-400 mb-2">
                  Analyzing Thread
                </h4>
                <p className="text-gray-400 text-sm">
                  Claude is reading through the messages and generating insights...
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}
