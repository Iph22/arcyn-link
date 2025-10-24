import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { ArcynEyeProvider } from '@/components/arcyn-eye'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arcyn Link - Intelligent Team Communication',
  description: 'Minimal. Intelligent. Seamless. Connect your team with AI-powered insights.',
  keywords: ['team communication', 'chat', 'AI', 'collaboration', 'Arcyn'],
  authors: [{ name: 'Arcyn' }],
}

export const viewport = "width=device-width, initial-scale=1.0";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {/* Wrap children with ArcynEyeProvider */}
          <ArcynEyeProvider defaultVisible={false} defaultFloating={true}>
            {children}
            <Toaster />
          </ArcynEyeProvider>
        </Providers>
      </body>
    </html>
  )
}