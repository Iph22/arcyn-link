import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'just now'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}d ago`
  }
  
  // More than 7 days, show date
  return d.toLocaleDateString()
}

export function getTeamColor(team: string) {
  switch (team) {
    case 'ARCYN_X':
      return 'text-cyan-500'
    case 'MODULEX':
      return 'text-violet-500'
    case 'NEXALAB':
      return 'text-emerald-500'
    default:
      return 'text-gray-500'
  }
}

export function getTeamName(team: string) {
  switch (team) {
    case 'ARCYN_X':
      return 'Arcyn.x'
    case 'MODULEX':
      return 'Modulex'
    case 'NEXALAB':
      return 'Nexalab'
    default:
      return team
  }
}

export function generateAvatar(username: string) {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500'
  ]
  
  const index = username.charCodeAt(0) % colors.length
  return colors[index]
}
