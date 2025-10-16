import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { channelId, userId } = await request.json()

    if (!channelId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get all messages from the channel for summarization
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        content,
        user_id,
        created_at,
        user_profiles (
          username,
          team
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100) // Limit to last 100 messages for performance

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch channel messages' },
        { status: 500 }
      )
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        summary: 'No messages found in this channel to summarize.',
        success: true
      })
    }

    // Build conversation text for summarization
    const conversationText = messages
      .map(m => {
        const username = m.user_profiles?.[0]?.username || 'Unknown User'
        const team = m.user_profiles?.[0]?.team || 'GENERAL'
        const timestamp = new Date(m.created_at).toLocaleString()
        return `[${timestamp}] [${team}] ${username}: ${m.content}`
      })
      .join('\n')

    // Create summarization prompt
    const prompt = `You are Arcyn Eye (A.E), analyzing a conversation from Arcyn Link. 

Please provide a comprehensive summary of the following channel conversation:

${conversationText}

Structure your summary as:

**Key Discussion Points:**
- Main topics and themes discussed

**Decisions Made:**
- Any conclusions or agreements reached

**Action Items:**
- Tasks or next steps mentioned

**Notable Insights:**
- Important information or insights shared

Keep the summary concise but comprehensive, focusing on actionable information and key takeaways.`

    // Get AI summary
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = completion.content[0]?.type === 'text' 
      ? completion.content[0].text 
      : 'Unable to generate summary at this time.'

    // Store summary in database
    const { error: summaryError } = await supabase
      .from('channel_summaries')
      .insert({
        channel_id: channelId,
        summary,
        created_by: userId,
        message_count: messages.length
      })

    if (summaryError) {
      console.error('Error storing summary:', summaryError)
      // Continue anyway, just log the error
    }

    // Also insert as a message in the channel
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        content: `📊 **Channel Summary**\n\n${summary}`,
        user_id: 'arcyn_eye',
        message_type: 'ai_summary'
      })

    if (messageError) {
      console.error('Error inserting summary message:', messageError)
    }

    return NextResponse.json({ 
      summary,
      messageCount: messages.length,
      success: true 
    })

  } catch (error) {
    console.error('Arcyn Summary API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
