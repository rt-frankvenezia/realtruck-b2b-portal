import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.profile.role !== 'realtruck_admin') redirect('/')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar profile={user.profile} />
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  )
}
