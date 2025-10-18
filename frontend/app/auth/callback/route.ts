import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/demo'

  if (code) {
    const supabase = createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successfully verified email - redirect to app
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } else {
      console.error('Error exchanging code for session:', error)
      // Redirect to error page with error message
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message)}`
      )
    }
  }

  // If no code, redirect to error page
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/error?message=No+confirmation+code+found`
  )
}