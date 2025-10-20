'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, Check, Mail } from 'lucide-react'

const teams = [
  {
    id: 'ARCYN_X',
    name: 'Arcyn.x',
    description: 'Core development team',
    color: 'from-cyan-500 to-cyan-600',
    borderColor: 'border-cyan-500'
  },
  {
    id: 'MODULEX',
    name: 'Modulex',
    description: 'Modular solutions team',
    color: 'from-violet-500 to-violet-600',
    borderColor: 'border-violet-500'
  },
  {
    id: 'NEXALAB',
    name: 'Nexalab',
    description: 'Research and innovation lab',
    color: 'from-emerald-500 to-emerald-600',
    borderColor: 'border-emerald-500'
  }
]

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { register } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTeam) {
      toast({
        title: "Team selection required",
        description: "Please select a team to join.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await register(email, username, password, selectedTeam)
      
      // If we get here without error, registration was successful
      toast({
        title: "Welcome to Arcyn Link!",
        description: "Your account has been created successfully.",
      })
    } catch (error: any) {
      if (error.message === 'CONFIRMATION_REQUIRED') {
        // Show email confirmation screen
        setShowConfirmation(true)
      } else {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Email confirmation screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-effect p-8 rounded-2xl text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-display font-bold gradient-text mb-4">
            Check Your Email
          </h1>
          
          <p className="text-arcyn-subtext mb-8">
            We've sent a confirmation link to <span className="text-arcyn-text font-semibold">{email}</span>. 
            Please check your inbox and click the link to verify your account.
          </p>

          <div className="space-y-4">
            <p className="text-sm text-arcyn-subtext">
              Didn't receive the email? Check your spam folder.
            </p>
            
            <Link href="/login">
              <Button variant="ghost" className="text-arcyn-gold hover:text-arcyn-soft-gold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-arcyn-black via-arcyn-graphite to-arcyn-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-8 text-arcyn-subtext hover:text-arcyn-text"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-effect p-8 rounded-2xl"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-arcyn-gold to-arcyn-soft-gold rounded-xl mx-auto mb-4"></div>
            <h1 className="text-2xl font-display font-bold gradient-text mb-2">
              Join Arcyn Link
            </h1>
            <p className="text-arcyn-subtext">
              Create your account and start collaborating
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-arcyn-text">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="bg-arcyn-matte-grey/50 border-arcyn-matte-grey text-arcyn-text placeholder:text-arcyn-subtext focus:border-arcyn-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-arcyn-text">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                minLength={3}
                maxLength={20}
                className="bg-arcyn-matte-grey/50 border-arcyn-matte-grey text-arcyn-text placeholder:text-arcyn-subtext focus:border-arcyn-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-arcyn-text">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="bg-arcyn-matte-grey/50 border-arcyn-matte-grey text-arcyn-text placeholder:text-arcyn-subtext focus:border-arcyn-gold pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-arcyn-subtext hover:text-arcyn-text"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-arcyn-text">
                Select your team
              </Label>
              <div className="space-y-3">
                {teams.map((team) => (
                  <motion.div
                    key={team.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                      selectedTeam === team.id
                        ? `${team.borderColor} bg-arcyn-matte-grey/50`
                        : 'border-arcyn-matte-grey bg-arcyn-matte-grey/30 hover:border-arcyn-soft-gold'
                    }`}
                    onClick={() => setSelectedTeam(team.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${team.color} rounded-lg flex-shrink-0`}></div>
                      <div className="flex-1">
                        <h3 className="text-arcyn-text font-semibold">{team.name}</h3>
                        <p className="text-arcyn-subtext text-sm">{team.description}</p>
                      </div>
                      {selectedTeam === team.id && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-arcyn-gold hover:text-arcyn-soft-gold font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}