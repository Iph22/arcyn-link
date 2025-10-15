# Arcyn Eye Integration Guide

## Overview

Arcyn Eye (A.E) is a real-time neural assistant interface featuring voice interaction, contextual memory, and ambient intelligence. This guide shows how to integrate A.E into your Arcyn Link application.

## Features Implemented

### ✅ Core Features
- **Real-time AI Chat**: Instant responses via existing `/api/arcyn-eye` endpoint
- **Voice Interface**: Web Speech API for input + Speech Synthesis for output
- **Neural Pulse Animation**: Animated orb visualization during processing
- **Contextual Memory**: Persistent storage of user preferences and conversation context
- **Adaptive UI**: Text/voice mode switching with responsive design
- **Floating Widget**: Cross-platform floating assistant window

### ✅ Technical Implementation
- **Memory System**: Local storage-based contextual memory with expiration
- **User Preferences**: Theme, voice settings, response style persistence
- **Project Awareness**: Current file and project state tracking
- **Keyboard Shortcuts**: Ctrl/Cmd + E to toggle A.E
- **Multiple Trigger Variants**: Button, orb, and minimal activation options

## Quick Start

### 1. Add to Your Layout

```tsx
// app/layout.tsx or your main layout component
import { ArcynEyeProvider } from '@/components/arcyn-eye'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ArcynEyeProvider defaultVisible={false} defaultFloating={true}>
          {children}
        </ArcynEyeProvider>
      </body>
    </html>
  )
}
```

### 2. Add Trigger Buttons

```tsx
// In your dashboard or any component
import { ArcynEyeTrigger } from '@/components/arcyn-eye'

function Dashboard() {
  return (
    <div>
      {/* Floating orb trigger */}
      <ArcynEyeTrigger variant="orb" />
      
      {/* Standard button */}
      <ArcynEyeTrigger variant="button" />
      
      {/* Minimal trigger for toolbars */}
      <ArcynEyeTrigger variant="minimal" />
    </div>
  )
}
```

### 3. Embedded Chat Mode

```tsx
// For embedded chat interfaces
import { ArcynEye } from '@/components/arcyn-eye'

function ChatPage() {
  return (
    <div className="h-screen">
      <ArcynEye isFloating={false} className="h-full" />
    </div>
  )
}
```

## API Integration

The A.E component integrates with your existing API endpoints and enhances them with memory context:

```typescript
// Enhanced API call with memory context
const response = await fetch('/api/arcyn-eye', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: userInput,
    context: recentMessages, // Last 5 messages
    memory: memoryContext, // User preferences, project state, etc.
    preferences: userPreferences // Voice, theme, response style
  })
})
```

## Memory System

### Automatic Context Storage
- User messages and A.E responses
- User preferences (voice, theme, response style)
- Project state (current files, context)
- Conversation context with expiration

### Manual Memory Management
```tsx
import { useArcynMemory } from '@/hooks/use-arcyn-memory'

function MyComponent() {
  const { storeMemory, getMemory, updatePreferences } = useArcynMemory()
  
  // Store custom context
  storeMemory('context', 'current_task', 'Building A.E interface')
  
  // Update user preferences
  updatePreferences({ voiceEnabled: true, responseStyle: 'technical' })
  
  // Retrieve stored data
  const lastTask = getMemory('context', 'current_task')
}
```

## Customization

### Visual Styling
The A.E interface uses your existing design system:
- **Colors**: Cyan/blue gradient with dark theme
- **Typography**: Mono font for futuristic feel
- **Animations**: Framer Motion for smooth interactions
- **Responsive**: Adapts to different screen sizes

### Behavior Configuration
```tsx
<ArcynEyeProvider 
  defaultVisible={false}     // Start hidden
  defaultFloating={true}     // Floating widget mode
>
  <ArcynEye
    isFloating={true}         // Floating vs embedded
    onClose={() => {}}        // Custom close handler
    className="custom-style"  // Additional styling
  />
</ArcynEyeProvider>
```

## File Structure

```
components/arcyn-eye/
├── arcyn-eye.tsx              # Main A.E component
├── arcyn-eye-provider.tsx     # Context provider
├── arcyn-eye-trigger.tsx      # Activation triggers
└── index.ts                   # Exports

hooks/
└── use-arcyn-memory.ts        # Memory management hook

app/
└── arcyn-eye-demo/           # Demo page
    └── page.tsx
```

## Demo & Testing

Visit `/arcyn-eye-demo` to see all features in action:
- Interactive showcase of all trigger variants
- Embedded vs floating mode comparison
- Live memory system demonstration
- Voice interface testing

## Browser Compatibility

### Required APIs
- **Speech Recognition**: Chrome, Edge, Safari (webkit)
- **Speech Synthesis**: All modern browsers
- **Local Storage**: Universal support
- **Framer Motion**: React 18+ compatible

### Graceful Degradation
- Voice features disable automatically if APIs unavailable
- Memory system falls back to session storage if needed
- Animations reduce on low-performance devices

## Integration with Existing Features

### Channel Integration
```tsx
// Add A.E to channel selector
import { ArcynEyeTrigger } from '@/components/arcyn-eye'

function ChannelSelector() {
  return (
    <div className="channel-header">
      <h2>Channels</h2>
      <ArcynEyeTrigger variant="minimal" />
    </div>
  )
}
```

### Dashboard Integration
```tsx
// Add to dashboard sidebar or header
function Dashboard() {
  return (
    <div className="dashboard">
      <header>
        <ArcynEyeTrigger variant="button" showLabel={false} />
      </header>
      {/* Dashboard content */}
    </div>
  )
}
```

## Performance Considerations

- **Memory Management**: Auto-cleanup of expired memories every 5 minutes
- **API Calls**: Debounced to prevent excessive requests
- **Animations**: GPU-accelerated with Framer Motion
- **Voice Processing**: Lazy-loaded speech APIs
- **Context Limiting**: Last 5 messages for API calls to control token usage

## Security & Privacy

- **Local Storage**: All memory data stored locally per user
- **No External Tracking**: Memory system is completely client-side
- **API Security**: Integrates with existing authentication
- **Voice Data**: Processed locally, not stored or transmitted

## Next Steps

1. **Test the demo page**: `/arcyn-eye-demo`
2. **Add provider to your layout**
3. **Place trigger buttons where needed**
4. **Customize styling and behavior**
5. **Monitor memory usage and performance**

The Arcyn Eye system is now fully integrated and ready for use across your Arcyn Link platform!
