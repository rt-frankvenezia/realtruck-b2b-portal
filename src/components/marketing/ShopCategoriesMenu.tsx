'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// The account-context header nav row ("Categories, Brands, SKU Lookup...")
// is where shopping navigation lives, per user direction — the left
// PortalSidebar is for account/company management only, not shopping.
export function ShopCategoriesMenu({ categories }: { categories: { name: string; slug: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-[#1c1c1e]">
        Categories
        <ChevronDown size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56 bg-white">
        <DropdownMenuItem render={<Link href="/dealer/shop" />}>Shop All</DropdownMenuItem>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuItem key={category.slug} render={<Link href={`/dealer/shop/${category.slug}`} />}>
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
