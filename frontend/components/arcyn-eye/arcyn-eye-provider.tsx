'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { ArcynEye } from './arcyn-eye'
import { useArcynMemory } from '@/hooks/use-arcyn-memory'
import { AnimatePresence } from 'framer-motion'

interface ArcynEyeContextType {
  isVisible: boolean
  showArcynEye: () => void
  hideArcynEye: () => void
  toggleArcynEye: () => void
  isFloating: boolean
  setFloating: (floating: boolean) => void
}

const ArcynEyeContext = createContext<ArcynEyeContextType | undefined>(undefined)

export function useArcynEye() {
  const context = useContext(ArcynEyeContext)
  if (!context) {
    throw new Error('useArcynEye must be used within ArcynEyeProvider')
  }
  return context
}

interface ArcynEyeProviderProps {
  children: React.ReactNode
  defaultVisible?: boolean
  defaultFloating?: boolean
}

export function ArcynEyeProvider({ 
  children, 
  defaultVisible = false,
  defaultFloating = true 
}: ArcynEyeProviderProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible)
  const [isFloating, setIsFloating] = useState(defaultFloating)
  const { storeMemory, getContextForAI } = useArcynMemory()

  // Store A.E activation in memory
  useEffect(() => {
    if (isVisible) {
      storeMemory('context', 'ae_last_activated', new Date().toISOString())
    }
  }, [isVisible, storeMemory])

  // Keyboard shortcut to toggle A.E (Ctrl/Cmd + E)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const showArcynEye = () => setIsVisible(true)
  const hideArcynEye = () => setIsVisible(false)
  const toggleArcynEye = () => setIsVisible(prev => !prev)
  const setFloating = (floating: boolean) => setIsFloating(floating)

  const contextValue: ArcynEyeContextType = {
    isVisible,
    showArcynEye,
    hideArcynEye,
    toggleArcynEye,
    isFloating,
    setFloating
  }

  return (
    <ArcynEyeContext.Provider value={contextValue}>
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <ArcynEye
            isFloating={isFloating}
            onClose={hideArcynEye}
            className="font-mono"
          />
        )}
      </AnimatePresence>
    </ArcynEyeContext.Provider>
  )
}
