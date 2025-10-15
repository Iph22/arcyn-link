'use client'

import { motion } from 'framer-motion'
import { Brain, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useArcynEye } from './arcyn-eye-provider'
import { cn } from '@/lib/utils'

interface ArcynEyeTriggerProps {
  variant?: 'button' | 'orb' | 'minimal'
  className?: string
  showLabel?: boolean
}

export function ArcynEyeTrigger({ 
  variant = 'button', 
  className,
  showLabel = true 
}: ArcynEyeTriggerProps) {
  const { showArcynEye, isVisible } = useArcynEye()

  if (variant === 'orb') {
    return (
      <motion.div
        className={cn(
          "relative cursor-pointer",
          className
        )}
        onClick={showArcynEye}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <Brain className="w-6 h-6 text-white" />
        </div>
        
        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {showLabel && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-xs text-gray-400 font-mono">Arcyn Eye</p>
          </div>
        )}
      </motion.div>
    )
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={showArcynEye}
        className={cn(
          "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10",
          isVisible && "bg-cyan-400/20",
          className
        )}
      >
        <Brain className="w-4 h-4" />
        {showLabel && <span className="ml-2 font-mono">A.E</span>}
      </Button>
    )
  }

  return (
    <Button
      onClick={showArcynEye}
      className={cn(
        "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono",
        isVisible && "from-cyan-500 to-blue-500",
        className
      )}
    >
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Brain className="w-4 h-4" />
          {!isVisible && (
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-300 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
        {showLabel && <span>Activate Arcyn Eye</span>}
      </div>
    </Button>
  )
}
