'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Used for dealers without an assigned pricing group — static dealer_price path.
// Dealers with a pricing group get VolumePricingPanel instead.
export function AddToCartButton({
  productId,
  name,
  brand,
  sku,
  unitPrice,
  categorySlug,
  disabled,
}: {
  productId: string
  name: string
  brand: string
  sku: string
  unitPrice: number
  categorySlug: string
  disabled?: boolean
}) {
  const { addItem, items } = useDealerCart()
  const [quantity, setQuantity] = useState(1)
  const hasLeerCap = items.some((i) => i.quoteId != null)

  if (hasLeerCap) {
    return (
      <p className="text-xs text-amber-700 rounded border border-amber-200 bg-amber-50 px-3 py-2">
        Your cart has a configured LEER cap.{' '}
        <a href="/dealer/shop/cart" className="font-medium underline">
          Checkout or remove it
        </a>{' '}
        before adding other items.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id={`qty-${productId}`}
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-20 shrink-0"
      />
      <Button
        disabled={disabled}
        className="flex-1 bg-[#0082C8] text-white hover:bg-[#006BAA]"
        onClick={() => {
          addItem(
            {
              productId,
              name,
              brand,
              sku,
              unitPrice,
              mapPrice: null,
              pricingTiers: null,
              categorySlug,
            },
            quantity,
          )
          toast.success(`Added ${quantity} × ${name} to cart`)
        }}
      >
        <ShoppingCart size={16} />
        ADD TO CART
      </Button>
    </div>
  )
}
