'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Extracted from the old standalone /login page so the same form can be
// embedded directly in the homepage's logged-out state — / now IS the
// login experience, /login just redirects here.
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full rounded border border-[#d5d5d5] bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="mb-1 text-xl font-bold text-[#2a2a2a]">Access Your Dealer Account</h2>
        <p className="text-sm text-[#6c6c6c]">Dealer, admin, or account access.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
          <AlertCircle size={16} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#2a2a2a]">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-[#d5d5d5]"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#2a2a2a]">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-[#d5d5d5]"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="mt-1 w-full bg-[#FFC60B] font-semibold text-[#1E1E1E] hover:bg-[#E5B109]"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
