import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DealerSidebar } from '@/components/dealer/DealerSidebar'

const DEALER_ROLES = ['dealer_admin', 'location_admin', 'staff'] as const

export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!DEALER_ROLES.includes(user.profile.role as (typeof DEALER_ROLES)[number])) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <DealerSidebar profile={user.profile} />
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  )
}
