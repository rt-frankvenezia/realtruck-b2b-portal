import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from '@/components/marketing/LoginForm'

// A dedicated login page, separate from the homepage's embedded login box —
// this is what "Log in" in the site header links to.
export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

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
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
