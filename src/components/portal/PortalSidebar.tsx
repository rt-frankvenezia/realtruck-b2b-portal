'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// icon is a rendered element (e.g. <Home size={20} strokeWidth={2} />), not a
// component reference — React elements are plain serializable objects and
// can cross the Server → Client Component boundary; bare component/function
// references cannot.
export type PortalNavItem = {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  exact?: boolean
  badge?: number
  // Represents a link to a real destination outside this app (e.g. a
  // separate order-portal site) that isn't wired up in the prototype —
  // rendered so the nav item exists visually, but not as a clickable Link.
  external?: boolean
}

export function PortalSidebar({ title, items }: { title: string; items: PortalNavItem[] }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-8 overflow-hidden rounded border border-[#d5d5d5] bg-white">
        <div className="bg-[#1E1E1E] px-6 py-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        <nav className="space-y-1 py-1">
          {items.map((item) => {
            if (item.external) {
              return (
                <div key={item.href} className="flex items-start gap-3 px-4 py-3 text-[#333333]">
                  <span className="mt-0.5 shrink-0">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-0.5 text-xs opacity-80">{item.description}</div>
                  </div>
                </div>
              )
            }
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 transition-colors',
                  active ? 'bg-[#FFC60B] text-[#1E1E1E]' : 'text-[#333333] hover:bg-neutral-100'
                )}
              >
                <span className="mt-0.5 shrink-0">{item.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {item.label}
                    {Boolean(item.badge) && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs opacity-80">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
