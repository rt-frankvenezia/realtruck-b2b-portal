'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
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
    <div className="min-h-screen bg-white">
      <div className="h-8 bg-[#FFC60B]" />
      <div className="h-[37px] bg-[#1c1c1e]" />
      <div className="flex h-20 items-center bg-[#2a2a2a]">
        <div className="mx-auto w-full max-w-[1440px] px-8">
          <Image src="/realtruck-logo.png" alt="RealTruck" width={140} height={24} className="h-10 w-auto" priority />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded border border-[#d5d5d5] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-[#2a2a2a]">Sign in</h1>
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
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#2a2a2a]">Email Address</label>
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
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#2a2a2a]">Password</label>
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
      </div>
    </div>
  )
}
