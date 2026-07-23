'use client'

import { useCart } from '@/components/customer/CartContext'

export function CartBadge() {
  const { items } = useCart()
  if (items.length === 0) return null
  return (
    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#1c1c1e]">
      {items.length}
    </span>
  )
}
