'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArcynEye, ArcynEyeProvider, ArcynEyeTrigger } from '@/components/arcyn-eye'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Mic, 
  MessageSquare, 
  Zap, 
  Eye,
  Sparkles,
  Cpu,
  Waves
} from 'lucide-react'

export default function ArcynEyeDemo() {
  const [demoMode, setDemoMode] = useState<'floating' | 'embedded' | 'showcase'>('showcase')

  return (
    <ArcynEyeProvider defaultVisible={false} defaultFloating={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white font-mono">Arcyn Eye Demo</h1>
                  <p className="text-sm text-gray-400">Neural Assistant Interface</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <ArcynEyeTrigger variant="minimal" />
                <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                  v1.0 Neural
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-white mb-4 font-mono">
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Arcyn Eye</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                A real-time neural assistant featuring voice interaction, contextual memory, 
                and ambient intelligence — seamlessly integrated into the Arcyn ecosystem.
              </p>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: MessageSquare,
                title: "Real-time Chat",
                description: "Instant AI responses with contextual understanding"
              },
              {
                icon: Mic,
                title: "Voice Interface",
                description: "Natural speech input with TTS output"
              },
              {
                icon: Brain,
                title: "Memory Core",
                description: "Persistent context and user preferences"
              },
              {
                icon: Waves,
                title: "Neural Pulse",
                description: "Animated visualization when processing"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors">
                  <feature.icon className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Demo Controls */}
          <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2 text-cyan-400" />
              Demo Modes
            </h3>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                variant={demoMode === 'showcase' ? 'default' : 'outline'}
                onClick={() => setDemoMode('showcase')}
                className={demoMode === 'showcase' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Showcase
              </Button>
              
              <Button
                variant={demoMode === 'floating' ? 'default' : 'outline'}
                onClick={() => setDemoMode('floating')}
                className={demoMode === 'floating' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
              >
                <Zap className="w-4 h-4 mr-2" />
                Floating Widget
              </Button>
              
              <Button
                variant={demoMode === 'embedded' ? 'default' : 'outline'}
                onClick={() => setDemoMode('embedded')}
                className={demoMode === 'embedded' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Embedded Chat
              </Button>
            </div>

            {/* Demo Content */}
            {demoMode === 'showcase' && (
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gray-800/50 border-gray-700 p-4">
                  <h4 className="font-semibold text-white mb-2">Floating Orb</h4>
                  <p className="text-gray-400 text-sm mb-4">Click to activate A.E</p>
                  <ArcynEyeTrigger variant="orb" className="mx-auto" />
                </Card>
                
                <Card className="bg-gray-800/50 border-gray-700 p-4">
                  <h4 className="font-semibold text-white mb-2">Button Trigger</h4>
                  <p className="text-gray-400 text-sm mb-4">Standard activation button</p>
                  <ArcynEyeTrigger variant="button" className="w-full" />
                </Card>
                
                <Card className="bg-gray-800/50 border-gray-700 p-4">
                  <h4 className="font-semibold text-white mb-2">Minimal Trigger</h4>
                  <p className="text-gray-400 text-sm mb-4">Compact interface element</p>
                  <ArcynEyeTrigger variant="minimal" className="mx-auto" />
                </Card>
              </div>
            )}

            {demoMode === 'embedded' && (
              <div className="h-[500px] bg-gray-900/50 rounded-lg border border-gray-700">
                <ArcynEye isFloating={false} className="h-full" />
              </div>
            )}

            {demoMode === 'floating' && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  Floating mode is active. Look for the A.E widget in the bottom-right corner.
                </p>
                <ArcynEyeTrigger variant="button" />
              </div>
            )}
          </div>

          {/* Technical Specs */}
          <div className="bg-gray-800/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-cyan-400" />
              Technical Features
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">Core Capabilities</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Real-time AI chat responses via Claude 3.5 Sonnet</li>
                  <li>• Voice input with Web Speech API</li>
                  <li>• Text-to-speech output synthesis</li>
                  <li>• Contextual memory storage and retrieval</li>
                  <li>• Adaptive UI with neural pulse animation</li>
                  <li>• Cross-platform floating widget</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-3">Integration</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Seamless Arcyn Link platform integration</li>
                  <li>• Keyboard shortcuts (Ctrl/Cmd + E)</li>
                  <li>• User preference persistence</li>
                  <li>• Project state awareness</li>
                  <li>• Team-based context understanding</li>
                  <li>• Memory-enhanced conversations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ArcynEyeProvider>
  )
}
