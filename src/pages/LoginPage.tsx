import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

const LIGHTNING_BG = '/assets/lightning-bg.png'
const LOGO_NP = '/assets/logo-np.png'

export function LoginPage() {
  const { inviteError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message.includes('auth/') ? 'Invalid email or password.' : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative bg-cover bg-center bg-no-repeat p-4"
      style={{
        backgroundImage: `url(${LIGHTNING_BG})`,
        backgroundColor: '#00001a',
      }}
    >
      <h1
        className="text-2xl sm:text-4xl md:text-6xl font-bold text-white tracking-wider mb-6 text-center"
        style={{
          fontFamily: "'Anton', system-ui, sans-serif",
          fontStyle: 'italic',
          textShadow: '0 0 20px rgba(100, 180, 255, 0.3)',
          letterSpacing: '0.15em',
        }}
      >
        NEWPHASE COACHING
      </h1>

      <div
        className="w-full max-w-md rounded-xl p-8 shadow-2xl border border-white/10"
        style={{ backgroundColor: '#252525' }}
      >
        <div className="flex justify-center mb-6">
          <img
            src={LOGO_NP}
            alt="Newphase"
            className="h-24 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 text-white placeholder:text-white/40 border-2 border-[#3b82f6] focus-visible:ring-[#3b82f6]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 text-white placeholder:text-white/40 border-2 border-[#3b82f6] focus-visible:ring-[#3b82f6] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {(error || inviteError) && (
            <p className="text-sm text-red-400">{inviteError ?? error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
