import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'
import { CartProvider } from '@/components/customer/CartContext'

const NAV_ITEMS: PortalNavItem[] = [
  { href: '/account', label: 'My Orders', description: 'Track orders & installations', icon: <Package size={20} strokeWidth={2} />, exact: true },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.profile.role !== 'customer') redirect('/')

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <SiteHeader variant="customer" context="account" userEmail={user.profile.email} userName={user.profile.name} />
        <div className="mx-auto max-w-[1440px] px-8 py-8">
          <div className="flex gap-8">
            <PortalSidebar title="My Account" items={NAV_ITEMS} />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
      </div>
    </CartProvider>
  )
}
