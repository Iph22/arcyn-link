'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'

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
      toast({
        title: "Welcome to Arcyn Link!",
        description: "Your account has been created successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-8 text-gray-400 hover:text-white"
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
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl mx-auto mb-4"></div>
            <h1 className="text-2xl font-display font-bold gradient-text mb-2">
              Join Arcyn Link
            </h1>
            <p className="text-gray-400">
              Create your account and start collaborating
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
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
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
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
                  className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
              <Label className="text-white">
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
                        ? `${team.borderColor} bg-gray-800/50`
                        : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedTeam(team.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${team.color} rounded-lg flex-shrink-0`}></div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{team.name}</h3>
                        <p className="text-gray-400 text-sm">{team.description}</p>
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
                className="text-cyan-400 hover:text-cyan-300 font-medium"
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
