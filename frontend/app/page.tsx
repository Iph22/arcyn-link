'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { MessageSquare, Zap, Users, Brain } from 'lucide-react'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/demo')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-arcyn-gold"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcyn-black via-arcyn-graphite to-arcyn-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-arcyn-gold to-arcyn-soft-gold rounded-lg"></div>
              <span className="text-xl font-display font-bold gradient-text">
                Arcyn Link
              </span>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="text-arcyn-text hover:text-arcyn-gold"
              >
                Login
              </Button>
              <Button
                variant="gradient"
                onClick={() => router.push('/register')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              <span className="gradient-text">Minimal.</span>{' '}
              <span className="text-arcyn-text">Intelligent.</span>{' '}
              <span className="gradient-text">Seamless.</span>
            </h1>
            <p className="text-xl md:text-2xl text-arcyn-text mb-8 max-w-3xl mx-auto">
              Connect your team with AI-powered insights. Built for Arcyn.x, Modulex, and Nexalab.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="gradient"
                onClick={() => router.push('/register')}
                className="text-lg px-8 py-4"
              >
                Start Collaborating
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/login')}
                className="text-lg px-8 py-4 border-arcyn-matte-grey text-arcyn-text hover:bg-arcyn-matte-grey"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-arcyn-text mb-4">
              Everything your team needs
            </h2>
            <p className="text-xl text-arcyn-text">
              Powerful features designed for modern team collaboration
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: MessageSquare,
                title: 'Real-time Chat',
                description: 'Instant messaging with threads and reactions',
                color: 'text-arcyn-gold'
              },
              {
                icon: Brain,
                title: 'AI Summaries',
                description: 'Claude-powered insights and key takeaways',
                color: 'text-arcyn-gold'
              },
              {
                icon: Users,
                title: 'Team Channels',
                description: 'Organized spaces for each team and project',
                color: 'text-arcyn-soft-gold'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Built for speed and seamless experience',
                color: 'text-arcyn-gold'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                className="glass-effect p-6 rounded-xl hover:bg-white/20 transition-colors"
              >
                <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold text-arcyn-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-arcyn-text">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Teams Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-4xl font-display font-bold text-arcyn-text mb-8">
              Built for your teams
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Arcyn.x',
                  description: 'Core development team',
                  color: 'from-arcyn-gold to-arcyn-soft-gold'
                },
                {
                  name: 'Modulex',
                  description: 'Modular solutions team',
                  color: 'from-arcyn-soft-gold to-arcyn-gold'
                },
                {
                  name: 'Nexalab',
                  description: 'Research and innovation lab',
                  color: 'from-arcyn-gold to-arcyn-soft-gold'
                }
              ].map((team, index) => (
                <motion.div
                  key={team.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                  className="glass-effect p-8 rounded-xl"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${team.color} rounded-full mx-auto mb-4`}></div>
                  <h3 className="text-2xl font-semibold text-arcyn-text mb-2">
                    {team.name}
                  </h3>
                  <p className="text-arcyn-text">
                    {team.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-arcyn-matte-grey">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-arcyn-gold to-arcyn-soft-gold rounded"></div>
            <span className="text-lg font-display font-bold gradient-text">
              Arcyn Link
            </span>
          </div>
          <p className="text-arcyn-subtext">
            © 2025 Arcyn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
