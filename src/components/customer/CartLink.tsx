'use client'

import Link from 'next/link'
import { useCart } from '@/components/customer/CartContext'

export function CartLink() {
  const { items } = useCart()
  return (
    <Link href="/cart" className="text-muted-foreground hover:text-foreground">
      Cart ({items.length})
    </Link>
  )
}
