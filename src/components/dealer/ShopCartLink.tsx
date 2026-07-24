'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'

export function ShopCartLink() {
  const { itemCount } = useDealerCart()
  return (
    <Button variant="outline" render={<Link href="/dealer/shop/cart" />} nativeButton={false}>
      <ShoppingCart size={16} />
      Cart{itemCount > 0 ? ` (${itemCount})` : ''}
    </Button>
  )
}
