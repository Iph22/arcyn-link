# Arcyn Eye (A.E) Integration Setup Guide

## Overview
This guide walks you through setting up the complete AI layer for Arcyn Eye (A.E) in your Arcyn Link platform. A.E provides real-time chat responses, channel summarization, and file analysis using Claude 3.5 Sonnet.

## 🚀 Quick Start

### 1. Environment Setup

Add your Anthropic API key to your environment variables:

```bash
# In your .env.local file
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

Get your API key from: https://console.anthropic.com/

### 2. Database Schema Updates

Run the SQL commands in `ARCYN_EYE_SCHEMA.sql` in your Supabase SQL editor:

```bash
# The schema file includes:
- message_type column for messages table
- channel_summaries table
- file_analyses table  
- A.E user profile
- Updated RLS policies
- Performance indexes
```

**Important:** Some commands require service role permissions. Run them in the Supabase dashboard SQL editor.

### 3. Replace Chat Component

Update your chat component to use the enhanced version:

```tsx
// In your dashboard or main chat page
import { EnhancedChat } from '@/components/chat/enhanced-chat'

// Replace SimpleChat with EnhancedChat
<EnhancedChat />
```

## 🎯 Features

### A.E Chat Responses
- **Trigger:** Mention `@A.E` or use `/ae` commands
- **Example:** "@A.E what's the status of our project?"
- **Response:** Intelligent context-aware replies

### Channel Summarization  
- **Trigger:** `/ae summarize` or `@A.E summarize`
- **Function:** Analyzes recent channel messages
- **Output:** Structured summary with key points and action items

### File Analysis
- **Supported:** PDF, TXT files (DOCX coming soon)
- **Method:** Drag & drop or click to upload
- **Output:** Document insights, key points, and recommendations

## 🔧 API Endpoints

### `/api/arcyn-eye` - Chat Responses
```typescript
POST /api/arcyn-eye
{
  "channelId": "uuid",
  "message": "user message",
  "userId": "uuid"
}
```

### `/api/arcyn-summary` - Channel Summary
```typescript
POST /api/arcyn-summary
{
  "channelId": "uuid", 
  "userId": "uuid"
}
```

### `/api/arcyn-analyze` - File Analysis
```typescript
POST /api/arcyn-analyze
FormData:
- file: File
- channelId: string
- userId: string
```

## 🎨 Visual Design

### A.E Message Styling
- **Container:** Cyan gradient background with glow border
- **Avatar:** Cyan gradient with bot icon and shadow glow
- **Username:** "Arcyn Eye" in cyan with sparkle icons
- **Processing:** Animated loader with "A.E Processing..." text

### Message Types
- 🤖 **ai_response:** Regular A.E chat responses
- 📊 **ai_summary:** Channel summaries with chart icon  
- 📄 **ai_analysis:** File analysis with document icon

### File Upload
- **Drop Zone:** Dashed border that highlights on drag
- **File Preview:** Shows filename, size, and analysis button
- **Progress:** Loading state during analysis

## 🔐 Security & Permissions

### Row Level Security (RLS)
- A.E can insert messages in any channel
- Users can only access their team's data
- File analyses are team-scoped
- Summaries respect team boundaries

### API Security
- All endpoints validate user authentication
- Channel access is verified per team membership
- File uploads are validated for type and size

## 🚨 Troubleshooting

### Common Issues

**1. "Cannot find module '@anthropic-ai/sdk'"**
```bash
npm install @anthropic-ai/sdk
```

**2. "A.E not responding"**
- Check ANTHROPIC_API_KEY in environment
- Verify Supabase schema is updated
- Check browser console for API errors

**3. "File upload failing"**
- Ensure file is PDF or TXT format
- Check file size (should be < 10MB)
- Verify user is authenticated

**4. "Messages not appearing"**
- Check Supabase realtime is enabled
- Verify RLS policies are correct
- Ensure A.E user profile exists

### Database Debugging

Check if A.E user exists:
```sql
SELECT * FROM user_profiles WHERE username = 'Arcyn Eye';
```

Check message types:
```sql
SELECT message_type, COUNT(*) FROM messages GROUP BY message_type;
```

Verify realtime subscriptions:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## 📊 Performance Considerations

### Token Limits
- Chat responses: 300 tokens max
- Summaries: 500 tokens max  
- File analysis: 600 tokens max
- Large files are truncated to ~15,000 characters

### Rate Limiting
- Consider implementing rate limits for A.E calls
- Cache summaries to avoid regeneration
- Batch file analyses for efficiency

### Database Optimization
- Indexes are created for performance
- Message history is limited to last 15 messages for context
- Summaries are limited to last 100 messages

## 🔄 Deployment

### Production Checklist
- [ ] Set ANTHROPIC_API_KEY in production environment
- [ ] Run all schema updates in production database
- [ ] Test A.E responses in production channels
- [ ] Verify file upload works with production storage
- [ ] Monitor API usage and costs
- [ ] Set up error logging and monitoring

### Environment Variables
```bash
# Production .env
ANTHROPIC_API_KEY="your-production-api-key"
NEXT_PUBLIC_SUPABASE_URL="your-production-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
```

## 🎉 Usage Examples

### Basic A.E Chat
```
User: @A.E what's the weather like for our team meeting?
A.E: I don't have access to real-time weather data, but I recommend checking a weather service for your location. For team meetings, consider having a backup indoor plan if weather might be a factor.
```

### Channel Summary
```
User: /ae summarize
A.E: 📊 **Channel Summary**

**Key Discussion Points:**
- Project timeline review for Q4 deliverables
- New feature requirements discussion
- Team resource allocation

**Decisions Made:**
- Move deadline to December 15th
- Assign Sarah to lead frontend development
- Schedule weekly check-ins on Fridays

**Action Items:**
- Update project documentation (Due: Nov 30)
- Set up development environment (Due: Dec 1)
- Review design mockups (Due: Dec 5)
```

### File Analysis
```
[User uploads project-plan.pdf]
A.E: 📄 **File Analysis: project-plan.pdf**

**Document Summary:**
Comprehensive project plan for Q4 product launch including timeline, resources, and risk assessment.

**Key Insights:**
- 12-week development cycle with 3 major milestones
- Budget allocation of $150K across 5 team members
- Critical path includes API development and testing phases

**Action Items:**
- Finalize API specifications by Week 2
- Complete user testing by Week 8  
- Prepare launch materials by Week 11

**Relevant Topics:**
- Agile development methodology
- Risk mitigation strategies
- Resource optimization
```

## 📈 Future Enhancements

### Planned Features
- **DOCX Support:** Full Microsoft Word document analysis
- **Image Analysis:** OCR and image content understanding  
- **Voice Messages:** Audio transcription and analysis
- **Thread Summaries:** AI summaries for message threads
- **Smart Notifications:** AI-powered notification prioritization
- **Meeting Transcripts:** Real-time meeting analysis and notes

### Integration Opportunities
- **Calendar Integration:** Meeting scheduling with A.E
- **Task Management:** Automatic task creation from conversations
- **Knowledge Base:** A.E learns from team documentation
- **Code Review:** AI-assisted code analysis and suggestions
- **Project Insights:** Cross-channel project status tracking

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs for database issues
3. Check Anthropic API status and usage
4. Verify all environment variables are set correctly

**Happy coding with Arcyn Eye! 🤖✨**
