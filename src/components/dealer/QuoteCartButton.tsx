'use client'

import { ShoppingCart, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']

type LineItem = {
  id: string
  description: string
  sku: string | null
  price: number
  quantity: number
  type?: string
}

export function QuoteCartButton({
  quoteId,
  brand,
  status,
  lineItems,
  configurationSnapshot,
}: {
  quoteId: string
  brand: string
  status: QuoteStatus
  lineItems: LineItem[]
  configurationSnapshot: { kit?: string; selections?: Record<string, string> } | null
}) {
  const { items, addItem, removeItem } = useDealerCart()

  if (status !== 'quote_sent') return null

  const capItems = lineItems.filter((li) => li.type === 'base' || li.type === 'option')
  const baseItem = capItems.find((li) => li.type === 'base') ?? capItems[0]
  const subtotal = capItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
  const syntheticProductId = `quote-${quoteId}`

  const isInCart = items.some((i) => i.productId === syntheticProductId)
  const hasConflict = !isInCart && items.some((i) => !i.quoteId)

  function handleAddToCart() {
    if (!baseItem) return
    addItem(
      {
        productId: syntheticProductId,
        name: baseItem.description,
        brand,
        sku: baseItem.sku ?? configurationSnapshot?.kit ?? quoteId,
        unitPrice: subtotal,
        mapPrice: null,
        pricingTiers: null,
        categorySlug: 'leer-fiberglass-caps',
        quoteId,
      },
      1,
    )
    toast.success(`${baseItem.description} added to cart`)
  }

  if (isInCart) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle2 size={13} />
          In Cart
        </span>
        <button
          onClick={() => removeItem(syntheticProductId)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Remove
        </button>
        <Link
          href="/dealer/shop/cart"
          className="rounded bg-[#FFC60B] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
        >
          Go to Cart →
        </Link>
      </div>
    )
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={hasConflict || !baseItem}
      title={hasConflict ? 'Remove other cart items first' : undefined}
      size="sm"
      className="bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
    >
      <ShoppingCart size={14} className="mr-1.5" />
      Add to Cart
    </Button>
  )
}
