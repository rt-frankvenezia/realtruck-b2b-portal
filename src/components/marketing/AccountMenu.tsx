'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AccountMenu({
  homeHref,
  accountLabel,
  loggedIn,
  children,
}: {
  homeHref: string
  accountLabel?: string
  loggedIn: boolean
  children: React.ReactNode
}) {
  if (!loggedIn) {
    return <Link href="/login">{children}</Link>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48 bg-white">
        <div className="px-2 py-1.5 text-sm text-muted-foreground">{accountLabel}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={homeHref} />}>My Account</DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action="/api/auth/logout" method="post" className="contents">
          <DropdownMenuItem render={<button type="submit" className="w-full text-left" />} nativeButton>
            Log out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
