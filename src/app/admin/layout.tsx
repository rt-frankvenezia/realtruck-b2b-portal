import { redirect } from 'next/navigation'
import { BarChart3, Building2, MapPin, UserCog, Tag, FileText, MessageSquareQuote } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'

const iconProps = { size: 20, strokeWidth: 2 }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.profile.role !== 'realtruck_admin') redirect('/')

  const supabase = await createClient()
  const { count: pendingCompanies } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_provisioning')

  const NAV_ITEMS: PortalNavItem[] = [
    { href: '/admin', label: 'Oversight', description: 'Dealer health at a glance', icon: <BarChart3 {...iconProps} />, exact: true },
    { href: '/admin/quotes', label: 'Quotes', description: 'SLA & orphaned-quote monitoring', icon: <MessageSquareQuote {...iconProps} /> },
    {
      href: '/admin/companies',
      label: 'Companies',
      description: 'Manage dealer organizations',
      icon: <Building2 {...iconProps} />,
      badge: pendingCompanies ?? 0,
    },
    { href: '/admin/locations', label: 'Locations', description: 'Manage dealer locations', icon: <MapPin {...iconProps} /> },
    { href: '/admin/users', label: 'Users', description: 'Manage user accounts', icon: <UserCog {...iconProps} /> },
    { href: '/admin/pricing-groups', label: 'Pricing Groups', description: 'Manage dealer pricing', icon: <Tag {...iconProps} /> },
    { href: '/admin/audit-log', label: 'Audit Log', description: 'Administrative actions', icon: <FileText {...iconProps} /> },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader variant="admin" userEmail={user.profile.email} userName={user.profile.name} />
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="flex gap-8">
          <PortalSidebar title="My Account" items={NAV_ITEMS} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
