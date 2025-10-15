'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase-auth-context'

interface MemoryItem {
  id: string
  type: 'preference' | 'context' | 'task' | 'project'
  key: string
  value: any
  timestamp: Date
  expiresAt?: Date
}

interface ProjectState {
  id: string
  name: string
  currentFiles: string[]
  lastActivity: Date
  context: string
}

interface UserPreference {
  theme: 'dark' | 'light'
  voiceEnabled: boolean
  responseStyle: 'concise' | 'detailed' | 'technical'
  preferredLanguage: string
}

export function useArcynMemory() {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [projectState, setProjectState] = useState<ProjectState | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreference>({
    theme: 'dark',
    voiceEnabled: true,
    responseStyle: 'concise',
    preferredLanguage: 'en'
  })
  const [isLoading, setIsLoading] = useState(true)
  
  const { profile } = useAuth()

  // Load memories from localStorage on mount
  useEffect(() => {
    if (!profile) return

    const loadMemories = () => {
      try {
        const storedMemories = localStorage.getItem(`ae_memories_${profile.id}`)
        const storedProject = localStorage.getItem(`ae_project_${profile.id}`)
        const storedPreferences = localStorage.getItem(`ae_preferences_${profile.id}`)

        if (storedMemories) {
          const parsedMemories = JSON.parse(storedMemories).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
            expiresAt: m.expiresAt ? new Date(m.expiresAt) : undefined
          }))
          
          // Filter out expired memories
          const validMemories = parsedMemories.filter((m: MemoryItem) => 
            !m.expiresAt || m.expiresAt > new Date()
          )
          
          setMemories(validMemories)
        }

        if (storedProject) {
          const parsedProject = JSON.parse(storedProject)
          setProjectState({
            ...parsedProject,
            lastActivity: new Date(parsedProject.lastActivity)
          })
        }

        if (storedPreferences) {
          setUserPreferences(JSON.parse(storedPreferences))
        }
      } catch (error) {
        console.error('Error loading A.E memories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMemories()
  }, [profile])

  // Save memories to localStorage whenever they change
  useEffect(() => {
    if (!profile || isLoading) return

    try {
      localStorage.setItem(`ae_memories_${profile.id}`, JSON.stringify(memories))
    } catch (error) {
      console.error('Error saving A.E memories:', error)
    }
  }, [memories, profile, isLoading])

  // Save project state to localStorage
  useEffect(() => {
    if (!profile || !projectState || isLoading) return

    try {
      localStorage.setItem(`ae_project_${profile.id}`, JSON.stringify(projectState))
    } catch (error) {
      console.error('Error saving A.E project state:', error)
    }
  }, [projectState, profile, isLoading])

  // Save preferences to localStorage
  useEffect(() => {
    if (!profile || isLoading) return

    try {
      localStorage.setItem(`ae_preferences_${profile.id}`, JSON.stringify(userPreferences))
    } catch (error) {
      console.error('Error saving A.E preferences:', error)
    }
  }, [userPreferences, profile, isLoading])

  const storeMemory = useCallback((
    type: MemoryItem['type'],
    key: string,
    value: any,
    expiresIn?: number // milliseconds
  ) => {
    const memory: MemoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      key,
      value,
      timestamp: new Date(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined
    }

    setMemories(prev => {
      // Remove existing memory with same key and type
      const filtered = prev.filter(m => !(m.key === key && m.type === type))
      return [...filtered, memory]
    })
  }, [])

  const getMemory = useCallback((type: MemoryItem['type'], key: string) => {
    const memory = memories.find(m => m.type === type && m.key === key)
    if (!memory) return null
    
    // Check if expired
    if (memory.expiresAt && memory.expiresAt <= new Date()) {
      // Remove expired memory
      setMemories(prev => prev.filter(m => m.id !== memory.id))
      return null
    }
    
    return memory.value
  }, [memories])

  const getMemoriesByType = useCallback((type: MemoryItem['type']) => {
    return memories
      .filter(m => m.type === type)
      .filter(m => !m.expiresAt || m.expiresAt > new Date())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [memories])

  const removeMemory = useCallback((type: MemoryItem['type'], key: string) => {
    setMemories(prev => prev.filter(m => !(m.type === type && m.key === key)))
  }, [])

  const updateProjectState = useCallback((updates: Partial<ProjectState>) => {
    setProjectState(prev => prev ? { ...prev, ...updates, lastActivity: new Date() } : null)
  }, [])

  const setProjectContext = useCallback((projectName: string, files: string[], context: string) => {
    const newProjectState: ProjectState = {
      id: `project_${Date.now()}`,
      name: projectName,
      currentFiles: files,
      lastActivity: new Date(),
      context
    }
    setProjectState(newProjectState)
  }, [])

  const updatePreferences = useCallback((updates: Partial<UserPreference>) => {
    setUserPreferences(prev => ({ ...prev, ...updates }))
  }, [])

  const getContextForAI = useCallback(() => {
    const recentMemories = memories
      .filter(m => !m.expiresAt || m.expiresAt > new Date())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10) // Last 10 memories

    return {
      userPreferences,
      projectState,
      recentContext: recentMemories.filter(m => m.type === 'context'),
      activeTasks: recentMemories.filter(m => m.type === 'task'),
      preferences: recentMemories.filter(m => m.type === 'preference')
    }
  }, [memories, userPreferences, projectState])

  const clearExpiredMemories = useCallback(() => {
    const now = new Date()
    setMemories(prev => prev.filter(m => !m.expiresAt || m.expiresAt > now))
  }, [])

  // Auto-cleanup expired memories every 5 minutes
  useEffect(() => {
    const interval = setInterval(clearExpiredMemories, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [clearExpiredMemories])

  return {
    // Memory management
    storeMemory,
    getMemory,
    getMemoriesByType,
    removeMemory,
    
    // Project state
    projectState,
    updateProjectState,
    setProjectContext,
    
    // User preferences
    userPreferences,
    updatePreferences,
    
    // AI context
    getContextForAI,
    
    // Utilities
    clearExpiredMemories,
    isLoading,
    
    // Stats
    memoryCount: memories.length,
    hasProject: !!projectState
  }
}
