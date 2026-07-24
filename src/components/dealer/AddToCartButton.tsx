'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const { addItem } = useDealerCart()
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor={`qty-${productId}`}>
          Quantity
        </label>
        <Input
          id={`qty-${productId}`}
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>
      <Button
        disabled={disabled}
        onClick={() => {
          addItem({ productId, name, brand, sku, unitPrice, categorySlug }, quantity)
          toast.success(`Added ${quantity} × ${name} to cart`)
        }}
      >
        <ShoppingCart size={16} />
        Add to Cart
      </Button>
    </div>
  )
}
