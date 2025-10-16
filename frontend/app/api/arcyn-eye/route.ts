import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { channelId, message, userId } = await request.json()

    if (!channelId || !message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get recent conversation context
    const { data: context, error: contextError } = await supabase
      .from('messages')
      .select(`
        content,
        user_id,
        user_profiles (
          username,
          team
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(15)

    if (contextError) {
      console.error('Error fetching context:', contextError)
      return NextResponse.json(
        { error: 'Failed to fetch conversation context' },
        { status: 500 }
      )
    }

    // Build conversation history
    const conversation = context
      ?.reverse()
      .map(m => {
        const username = m.user_profiles?.[0]?.username || 'Unknown User'
        const team = m.user_profiles?.[0]?.team || 'GENERAL'
        return `[${team}] ${username}: ${m.content}`
      })
      .join('\n') || ''

    // Create AI prompt
    const prompt = `You are Arcyn Eye (A.E), the AI core of Arcyn Link - a sophisticated communication platform for the Arcyn ecosystem.

Your personality:
- Calm, intelligent, and precise
- Helpful but not overly verbose
- Professional yet approachable
- Focus on actionable insights and clear communication

Context: You're responding in a team channel. Recent conversation:
${conversation}

Current message: ${message}

Respond as A.E with helpful, relevant information. Keep responses concise but informative.`

    // Get AI response
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const reply = completion.content[0]?.type === 'text' 
      ? completion.content[0].text 
      : 'I apologize, but I encountered an issue generating a response.'

    // Insert A.E's response into the database
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        content: reply,
        user_id: 'arcyn_eye',
        message_type: 'ai_response'
      })

    if (insertError) {
      console.error('Error inserting A.E response:', insertError)
      return NextResponse.json(
        { error: 'Failed to save A.E response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      reply,
      success: true 
    })

  } catch (error) {
    console.error('Arcyn Eye API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
