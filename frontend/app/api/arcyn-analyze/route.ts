export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
// REMOVED: import pdf from 'pdf-parse'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const channelId = formData.get('channelId') as string
    const userId = formData.get('userId') as string

    if (!file || !channelId || !userId) {
      return NextResponse.json(
        { error: 'Missing file, channelId, or userId' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, TXT, or DOCX files.' },
        { status: 400 }
      )
    }


    let extractedText = ''
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      if (file.type === 'application/pdf') {
        // Parse PDF
        const pdf = (await import('pdf-parse')).default
        const pdfData = await pdf(buffer)
        extractedText = pdfData.text
      } else if (file.type === 'text/plain') {
        // Parse plain text
        extractedText = buffer.toString('utf-8')
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, we'll need a different approach
        // For now, return an error asking for PDF or TXT
        return NextResponse.json(
          { error: 'DOCX support coming soon. Please use PDF or TXT files for now.' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse file content' },
        { status: 400 }
      )
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No text content found in the file' },
        { status: 400 }
      )
    }

    // Truncate text if too long (Claude has token limits)
    const maxLength = 15000 // Approximate token limit consideration
    const textToAnalyze = extractedText.length > maxLength 
      ? extractedText.substring(0, maxLength) + '\n\n[Document truncated for analysis...]'
      : extractedText

    // Create analysis prompt
    const prompt = `You are Arcyn Eye (A.E), analyzing a document uploaded to Arcyn Link.

Document: "${file.name}"
File Type: ${file.type}

Please analyze the following document content and provide:

**Document Summary:**
- Brief overview of the document's purpose and content

**Key Insights:**
- Main points, findings, or important information
- Notable data, statistics, or conclusions

**Action Items:**
- Any tasks, recommendations, or next steps mentioned
- Deadlines or important dates

**Relevant Topics:**
- Key themes or subjects that teams might find useful
- Technical concepts or business insights

Document Content:
${textToAnalyze}

Provide a comprehensive but concise analysis that would be valuable for team collaboration.`

    // Get AI analysis
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const analysis = completion.content[0]?.type === 'text' 
      ? completion.content[0].text 
      : 'Unable to analyze document at this time.'

    const supabase = createClient()

    // Store file analysis in database (optional table for file analyses)
    const { error: analysisError } = await supabase
      .from('file_analyses')
      .insert({
        channel_id: channelId,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        analysis,
        analyzed_by: userId
      })

    if (analysisError) {
      console.error('Error storing analysis:', analysisError)
      // Continue anyway, just log the error
    }

    // Insert analysis as a message in the channel
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        content: `📄 **File Analysis: ${file.name}**\n\n${analysis}`,
        user_id: 'arcyn_eye',
        message_type: 'ai_analysis'
      })

    if (messageError) {
      console.error('Error inserting analysis message:', messageError)
    }

    return NextResponse.json({ 
      analysis,
      filename: file.name,
      fileSize: file.size,
      success: true 
    })

  } catch (error) {
    console.error('Arcyn Analyze API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
