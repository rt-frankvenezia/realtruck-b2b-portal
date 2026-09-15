'use client'

import { useState } from 'react'
import { ShoppingCart, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/status-labels'
import { resolveEffectiveTier, resolveEffectivePrice, type PricingTier } from '@/lib/pricing'

type Props = {
  productId: string
  name: string
  brand: string
  sku: string
  categorySlug: string
  mapPrice: number
  pricingTiers: PricingTier[]
  disabled?: boolean
}

export function VolumePricingPanel({
  productId,
  name,
  brand,
  sku,
  categorySlug,
  mapPrice,
  pricingTiers,
  disabled,
}: Props) {
  const { addItem } = useDealerCart()
  const [quantity, setQuantity] = useState(1)

  const effectiveTier = resolveEffectiveTier(pricingTiers, quantity)
  const effectivePrice = resolveEffectivePrice(mapPrice, pricingTiers, quantity)
  const hasVolumeTiers = pricingTiers.length > 1

  function handleAddToCart() {
    addItem(
      {
        productId,
        name,
        brand,
        sku,
        unitPrice: effectivePrice,
        mapPrice,
        pricingTiers,
        categorySlug,
      },
      quantity,
    )
    toast.success(`Added ${quantity} × ${name} to cart`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Price display */}
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">Your Dealer Price</p>
        <p className="text-3xl font-bold">{formatCurrency(effectivePrice)}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-muted-foreground">MAP: {formatCurrency(mapPrice)}</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {effectiveTier.discountPercent}% off
          </span>
        </div>
      </div>

      {/* Volume pricing table */}
      {hasVolumeTiers && (
        <div className="rounded-md border">
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <TrendingDown size={13} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Volume Pricing</span>
          </div>
          <div className="divide-y">
            {pricingTiers.map((tier) => {
              const tierPrice = mapPrice * (1 - tier.discountPercent / 100)
              const isActive = tier.minQty === effectiveTier.minQty
              return (
                <div
                  key={tier.minQty}
                  className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-primary/5 font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  <span>
                    Buy {tier.minQty}+{isActive && <span className="ml-1.5 text-xs text-primary">← current</span>}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{tier.discountPercent}% off</span>
                    <span className={isActive ? 'text-foreground' : ''}>{formatCurrency(tierPrice)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div className="border-t pt-4 flex flex-col gap-3">
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
        <Button disabled={disabled} onClick={handleAddToCart}>
          <ShoppingCart size={16} />
          Add to Cart
        </Button>
      </div>
    </div>
  )
}
