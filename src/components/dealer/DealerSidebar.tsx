'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/lib/database.types'

type NavItem = { href: string; label: string; exact?: boolean; hideForStaff?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/dealer', label: 'Dashboard', exact: true },
  { href: '/dealer/quotes', label: 'Quotes' },
  { href: '/dealer/installations', label: 'Installations' },
  { href: '/dealer/payouts', label: 'Payouts', hideForStaff: true },
  { href: '/dealer/warranties', label: 'Warranties' },
]

export function DealerSidebar({ profile }: { profile: Tables<'users'> }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 flex-col border-r bg-muted/30 p-4">
      <div className="mb-6 px-2">
        <p className="font-semibold leading-tight">RealTruck</p>
        <p className="text-xs text-muted-foreground">Dealer Portal</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.filter((item) => !(item.hideForStaff && profile.role === 'staff')).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <p className="truncate px-2 text-sm font-medium">{profile.name}</p>
        <p className="truncate px-2 text-xs text-muted-foreground">{profile.email}</p>
        <form action="/api/auth/logout" method="post" className="mt-2">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            Log out
          </Button>
        </form>
      </div>
    </aside>
  )
}
