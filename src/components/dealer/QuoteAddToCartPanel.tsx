'use client'

import { ShoppingCart, CheckCircle2, AlertCircle, Info } from 'lucide-react'
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

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function QuoteAddToCartPanel({
  quoteId,
  brand,
  status,
  lineItems,
  configurationSnapshot,
  customerName,
  vehicleYear,
  vehicleMake,
  vehicleModel,
}: {
  quoteId: string
  brand: string
  status: QuoteStatus
  lineItems: LineItem[]
  configurationSnapshot: { kit?: string; selections?: Record<string, string> } | null
  customerName: string | null
  vehicleYear: number | null
  vehicleMake: string | null
  vehicleModel: string | null
}) {
  const { items, addItem, removeItem } = useDealerCart()

  if (status !== 'quote_sent') return null

  const capItems = lineItems.filter((li) => li.type === 'base' || li.type === 'option')
  const customItems = lineItems.filter((li) => li.type === 'custom')
  const baseItem = capItems.find((li) => li.type === 'base') ?? capItems[0]
  const optionItems = capItems.filter((li) => li !== baseItem)
  const subtotal = capItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
  const vehicle = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ')
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

  return (
    <div className={PANEL}>
      <div className={PANEL_HEADER}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">{brand}</span>
          <h2 className="font-semibold text-white">{isInCart ? 'Added to Cart' : 'Add to Cart'}</h2>
          {isInCart && (
            <span className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              <CheckCircle2 size={11} />
              In Cart
            </span>
          )}
        </div>
      </div>
      <div className={PANEL_BODY}>
        <div className="flex flex-col gap-4">
          {/* Order summary */}
          <div className="divide-y divide-[#d5d5d5] rounded border border-[#d5d5d5]">
            <div className="flex items-center justify-between bg-muted/40 px-4 py-2">
              <div className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item</div>
              <div className="w-24 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dealer Price
              </div>
            </div>
            {baseItem && (
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{baseItem.description}</p>
                  {baseItem.sku && <p className="mt-0.5 font-mono text-xs text-muted-foreground">{baseItem.sku}</p>}
                  {configurationSnapshot?.kit && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Kit: <span className="font-mono">{configurationSnapshot.kit}</span>
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatCurrency(baseItem.price)}</p>
              </div>
            )}
            {optionItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 bg-muted/20 px-4 py-2">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="shrink-0 text-sm">{formatCurrency(item.price)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between bg-muted/10 px-4 py-3">
              <p className="text-sm font-semibold">Subtotal</p>
              <p className="text-sm font-bold">{formatCurrency(subtotal)}</p>
            </div>
          </div>

          {/* Custom items excluded */}
          {customItems.length > 0 && (
            <div className="flex items-start gap-2 rounded border border-[#e8e8e8] bg-[#f8f8f8] px-3 py-2.5">
              <Info size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {customItems.length} custom line item{customItems.length > 1 ? 's' : ''}
                </span>{' '}
                (surcharges, installation, etc.) are not included in the cart order.
              </p>
            </div>
          )}

          {/* Cart conflict warning */}
          {hasConflict && (
            <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-700">
                Your cart has other items.{' '}
                <Link href="/dealer/shop/cart" className="font-medium underline">
                  View cart
                </Link>{' '}
                and remove them before adding this cap.
              </p>
            </div>
          )}

          {/* Customer + vehicle context */}
          {(customerName || vehicle) && (
            <div className="flex gap-6 text-sm">
              {customerName && (
                <div>
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <p className="font-medium">{customerName}</p>
                </div>
              )}
              {vehicle && (
                <div>
                  <span className="text-xs text-muted-foreground">Vehicle</span>
                  <p className="font-medium">{vehicle}</p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between gap-4">
            {isInCart ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Cap is in your cart — proceed to checkout to complete the order.
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => removeItem(syntheticProductId)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                  <Link
                    href="/dealer/shop/cart"
                    className="rounded bg-[#FFC60B] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
                  >
                    Go to Cart →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Adds the configured cap to your cart for checkout through the normal order flow.
                </p>
                <Button
                  onClick={handleAddToCart}
                  disabled={hasConflict || !baseItem}
                  className="shrink-0 bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
                >
                  <ShoppingCart size={14} className="mr-1.5" />
                  Add to Cart
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
