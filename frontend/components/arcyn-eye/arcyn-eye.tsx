'use client'

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Send, Minimize2, Maximize2, X, Brain, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useArcynMemory } from '@/hooks/use-arcyn-memory'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  type: 'user' | 'ae'
  timestamp: Date
}

interface ArcynEyeProps {
  isFloating?: boolean
  onClose?: () => void
  className?: string
}

export function ArcynEye({ isFloating = false, onClose, className }: ArcynEyeProps) {
  const [isExpanded, setIsExpanded] = useState(!isFloating)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [showMemoryStatus, setShowMemoryStatus] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  
  // Memory system integration
  const { 
    storeMemory, 
    getContextForAI, 
    userPreferences, 
    updatePreferences,
    projectState,
    memoryCount 
  } = useArcynMemory()

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'
        recognitionRef.current = recognition

        if (recognitionRef.current) {
          recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          handleUserMessage(transcript)
        }

        if (recognitionRef.current) {
          recognitionRef.current.onerror = () => {
            setIsListening(false)
          }

          recognitionRef.current.onend = () => {
            setIsListening(false)
          }
        }
        }
      }

      // Speech Synthesis
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleUserMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsProcessing(true)

    try {
      // Store user message in memory
      storeMemory('context', 'last_user_message', content.trim())
      
      // Get AI context from memory system
      const memoryContext = getContextForAI()
      
      // Call existing Arcyn Eye API with enhanced context
      const response = await fetch('/api/arcyn-eye', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content.trim(),
          context: messages.slice(-5), // Last 5 messages for context
          memory: memoryContext, // Enhanced memory context
          preferences: userPreferences
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aeMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          type: 'ae',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, aeMessage])
        
        // Store A.E response in memory
        storeMemory('context', 'last_ae_response', data.response)

        // Text-to-speech for A.E responses
        if (synthRef.current && (inputMode === 'voice' || userPreferences.voiceEnabled)) {
          const utterance = new SpeechSynthesisUtterance(data.response)
          utterance.rate = 0.9
          utterance.pitch = 1.1
          utterance.volume = 0.8
          synthRef.current.speak(utterance)
        }
      }
    } catch (error) {
      console.error('Error communicating with A.E:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'ae',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setIsListening(true)
      setInputMode('voice')
      recognitionRef.current.start()
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInputMode('text')
    handleUserMessage(inputValue)
  }

  // Neural Pulse Animation Component
  const NeuralPulse = ({ isActive }: { isActive: boolean }) => (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Core orb */}
      <motion.div
        className="absolute w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          opacity: isActive ? [0.8, 1, 0.8] : 0.6,
        }}
        transition={{
          duration: isActive ? 1.5 : 0,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Pulse rings */}
      {isActive && (
        <>
          <motion.div
            className="absolute w-12 h-12 border-2 border-cyan-400/30 rounded-full"
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute w-12 h-12 border-2 border-blue-400/20 rounded-full"
            animate={{
              scale: [1, 1.8, 2.5],
              opacity: [0.4, 0.2, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5
            }}
          />
        </>
      )}
    </div>
  )

  if (isFloating && !isExpanded) {
    return (
      <motion.div
        className={cn(
          "fixed bottom-6 right-6 z-50 cursor-pointer",
          className
        )}
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-full p-4 shadow-2xl">
          <NeuralPulse isActive={isProcessing || isListening} />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(
        "bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl",
        isFloating 
          ? "fixed bottom-6 right-6 w-96 h-[500px] z-50" 
          : "w-full h-full",
        className
      )}
      initial={isFloating ? { scale: 0, opacity: 0 } : false}
      animate={isFloating ? { scale: 1, opacity: 1 } : false}
      exit={isFloating ? { scale: 0, opacity: 0 } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <NeuralPulse isActive={isProcessing || isListening} />
          <div>
            <h3 className="text-lg font-semibold text-white font-mono">Arcyn Eye</h3>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-cyan-400">Neural Assistant</p>
              {memoryCount > 0 && (
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Brain className="w-3 h-3" />
                  <span>{memoryCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isFloating && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="mb-4">
                <NeuralPulse isActive={false} />
              </div>
              <p className="text-sm">Hello, I'm Arcyn Eye.</p>
              <p className="text-xs mt-1">How can I assist you today?</p>
            </div>
          )}
          
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-lg",
                  message.type === 'user'
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-800 text-gray-100 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
          
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-800 border border-cyan-500/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
                  <span className="text-xs text-gray-400 ml-2">A.E is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask Arcyn Eye anything..."}
            disabled={isListening || isProcessing}
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
          
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleVoiceInput}
            disabled={isProcessing}
            className={cn(
              "text-gray-400 hover:text-white",
              isListening && "text-cyan-400 bg-cyan-400/10"
            )}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || isProcessing || isListening}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          {inputMode === 'voice' ? 'Voice mode active' : 'Press mic for voice input'}
        </p>
      </div>
    </motion.div>
  )
}
