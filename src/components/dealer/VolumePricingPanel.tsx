'use client'

import { type ReactNode, useState } from 'react'
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
  children?: ReactNode
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
  children,
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
    <div className="flex flex-col">
      {/* Price display */}
      <div className="border-t py-5">
        <div className="flex divide-x">
          <div className="pr-6">
            <p className="text-xs text-muted-foreground">Your Price</p>
            <p className="text-2xl font-bold">{formatCurrency(effectivePrice)}</p>
          </div>
          <div className="pl-6">
            <p className="text-xs text-muted-foreground">MAP</p>
            <p className="text-xl font-medium text-muted-foreground">{formatCurrency(mapPrice)}</p>
          </div>
        </div>
        {effectiveTier.discountPercent > 0 && (
          <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {effectiveTier.discountPercent}% off
          </span>
        )}
      </div>

      {/* Volume pricing table — stays near the price */}
      {hasVolumeTiers && (
        <div className="mt-3 rounded-md border">
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <TrendingDown size={13} className="text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Volume Pricing</span>
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

      {/* PART # + Guaranteed Fit + RapidShip + Availability injected from the server component */}
      {children}

      {/* Quantity inline with Add to Cart */}
      <div className="mt-5 flex items-center gap-2">
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
          onClick={handleAddToCart}
          className="flex-1 bg-[#0082C8] text-white hover:bg-[#006BAA]"
        >
          <ShoppingCart size={16} />
          ADD TO CART
        </Button>
      </div>
    </div>
  )
}
