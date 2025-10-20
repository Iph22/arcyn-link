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
      return 'text-arcyn-gold'
    case 'MODULEX':
      return 'text-arcyn-soft-gold'
    case 'NEXALAB':
      return 'text-arcyn-gold'
    default:
      return 'text-arcyn-subtext'
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
    'bg-arcyn-gold',
    'bg-arcyn-soft-gold',
    'bg-gradient-to-r from-arcyn-gold to-arcyn-soft-gold',
    'bg-gradient-to-r from-arcyn-soft-gold to-arcyn-gold',
    'bg-arcyn-gold',
    'bg-arcyn-soft-gold',
    'bg-gradient-to-br from-arcyn-gold to-arcyn-soft-gold',
    'bg-gradient-to-tl from-arcyn-gold to-arcyn-soft-gold'
  ]
  
  const index = username.charCodeAt(0) % colors.length
  return colors[index]
}
