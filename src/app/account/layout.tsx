import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.profile.role !== 'customer') redirect('/')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <Link href="/account" className="font-semibold">
          My Account
        </Link>
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </header>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
