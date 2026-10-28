'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Package, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/status-labels'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import {
  actionCreateQuoteCheckout,
  actionMarkPartsArranged,
  actionUndoPartsArranged,
} from '@/lib/actions/quotes'

type LineItem = {
  id: string
  description: string
  sku: string | null
  price: number
  msrp: number
  quantity: number
  type?: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  quoteId: string
  displayNum: string
  customerName: string | null
  lineItems: LineItem[]
  partsStatus: string
  partsArrangedReason?: string | null
  partsArrangedNote?: string | null
  orderNumber?: string | null
}

const ARRANGE_REASONS = ['From Stock', 'Ordered Outside Portal']

// Items that represent real catalog products (have a SKU and are base/option type)
function getOrderableGroups(items: LineItem[]): { base: LineItem; options: LineItem[] }[] {
  const groups: { base: LineItem; options: LineItem[] }[] = []
  let current: { base: LineItem; options: LineItem[] } | null = null
  for (const item of items) {
    if (item.type === 'base') {
      if (item.sku) {
        current = { base: item, options: [] }
        groups.push(current)
      } else {
        current = null
      }
    } else if (item.type === 'option' && current) {
      current.options.push(item)
    } else {
      current = null
    }
  }
  return groups
}

export function OrderPartsDrawer({
  open,
  onClose,
  quoteId,
  displayNum,
  customerName,
  lineItems,
  partsStatus,
  partsArrangedReason,
  partsArrangedNote,
  orderNumber,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showArrange, setShowArrange] = useState(false)
  const [arrangeReason, setArrangeReason] = useState(ARRANGE_REASONS[0])
  const [arrangeNote, setArrangeNote] = useState('')
  const { items: cartItems, addItem, removeItem } = useDealerCart()

  const groups = getOrderableGroups(lineItems)
  const hasOrderable = groups.length > 0
  const syntheticProductId = `quote-${quoteId}`
  const isInCart = cartItems.some((i) => i.productId === syntheticProductId)
  const hasConflict = !isInCart && cartItems.some((i) => !i.quoteId)

  const dealerSubtotal = groups.reduce((sum, g) => {
    const base = g.base.price * g.base.quantity
    const opts = g.options.reduce((s, o) => s + o.price * o.quantity, 0)
    return sum + base + opts
  }, 0)

  function handleCheckout() {
    startTransition(async () => {
      // Add items to dealer cart with quote tag
      const firstGroup = groups[0]
      if (firstGroup && !isInCart) {
        const totalPrice = groups.reduce((s, g) => {
          return s + g.base.price * g.base.quantity + g.options.reduce((o, opt) => o + opt.price * opt.quantity, 0)
        }, 0)
        addItem(
          {
            productId: syntheticProductId,
            name: firstGroup.base.description,
            brand: '',
            sku: firstGroup.base.sku ?? quoteId,
            unitPrice: totalPrice,
            mapPrice: null,
            pricingTiers: null,
            categorySlug: 'leer-fiberglass-caps',
            quoteId,
          },
          1,
        )
      }
      await actionCreateQuoteCheckout(quoteId)
      router.push('/dealer/shop/checkout')
    })
  }

  function handleArranged() {
    startTransition(async () => {
      await actionMarkPartsArranged(quoteId, arrangeReason, arrangeNote)
      setShowArrange(false)
    })
  }

  function handleUndoArranged() {
    startTransition(async () => {
      await actionUndoPartsArranged(quoteId)
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-[#1E1E1E] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Review Your Order</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              Quote {displayNum} · {customerName ?? 'Customer'}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Ordered state */}
          {partsStatus === 'ordered' && orderNumber && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 size={16} />
                <p className="font-semibold">Order placed</p>
              </div>
              <p className="mt-1 text-sm text-green-600">Order {orderNumber}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push('/dealer/orders')}
              >
                View Order
              </Button>
            </div>
          )}

          {/* Parts arranged state */}
          {partsStatus === 'parts_arranged' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle2 size={16} />
                <p className="font-semibold">Parts Arranged — {partsArrangedReason}</p>
              </div>
              {partsArrangedNote && (
                <p className="mt-1 text-sm text-blue-600">{partsArrangedNote}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                className="mt-3 text-destructive hover:text-destructive"
                onClick={handleUndoArranged}
              >
                {pending ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : null}
                Undo Parts Arranged
              </Button>
            </div>
          )}

          {!hasOrderable ? (
            <div className="py-12 text-center">
              <Package size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">No parts to order</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This quote has no catalog products to purchase through the portal.
              </p>
            </div>
          ) : (
            <>
              {/* Product groups */}
              <div className="flex flex-col gap-4">
                {groups.map((g) => {
                  const groupTotal =
                    g.base.price * g.base.quantity +
                    g.options.reduce((s, o) => s + o.price * o.quantity, 0)
                  return (
                    <div key={g.base.id} className="rounded-lg border border-[#e8e8e8]">
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">{g.base.description}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {g.base.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(groupTotal)}</p>
                          <p className="text-[11px] text-muted-foreground">dealer price</p>
                        </div>
                      </div>
                      {g.options.length > 0 && (
                        <div className="border-t border-[#f0f0f0] px-4 pb-3">
                          <p className="pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Configuration
                          </p>
                          {g.options.map((o) => (
                            <div key={o.id} className="flex items-center justify-between py-0.5 text-xs text-muted-foreground">
                              <span>{o.description}</span>
                              {o.price > 0 && <span>{formatCurrency(o.price)}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Subtotal */}
              <div className="mt-4 rounded-lg border border-[#e8e8e8] px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Parts subtotal</span>
                  <span className="font-semibold">{formatCurrency(dealerSubtotal)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shipping and applicable tax calculated at checkout.
                </p>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Installation, custom charges, and customer discounts stay on the customer quote.
              </p>

              {hasConflict && (
                <div className="mt-3 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                  Your cart has other items. The quote uses a separate checkout — your current cart is saved.
                </div>
              )}
            </>
          )}

          {/* Mark Parts Arranged form */}
          {showArrange && (
            <div className="mt-4 rounded-lg border border-[#e8e8e8] p-4">
              <p className="mb-3 text-sm font-semibold">Mark Parts Arranged</p>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reason
              </label>
              <select
                value={arrangeReason}
                onChange={(e) => setArrangeReason(e.target.value)}
                className="mb-3 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                {ARRANGE_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <Textarea
                placeholder="Optional note or external order reference…"
                value={arrangeNote}
                onChange={(e) => setArrangeNote(e.target.value)}
                rows={2}
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowArrange(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={handleArranged}
                  className="bg-[#1E1E1E] text-white hover:bg-[#333]"
                >
                  {pending && <Loader2 size={12} className="mr-1.5 animate-spin" />}
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t p-4">
          {partsStatus === 'not_ordered' && hasOrderable && (
            <div className="flex flex-col gap-2">
              <Button
                disabled={pending}
                onClick={handleCheckout}
                className="w-full bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
              >
                {pending ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <ShoppingCart size={14} className="mr-1.5" />
                )}
                Continue to Checkout
              </Button>
              {!showArrange && (
                <button
                  onClick={() => setShowArrange(true)}
                  className="text-center text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Mark Parts Arranged instead
                </button>
              )}
            </div>
          )}

          {partsStatus === 'in_checkout' && (
            <Button
              disabled={pending}
              onClick={() => router.push('/dealer/shop/checkout')}
              className="w-full bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
            >
              <ShoppingCart size={14} className="mr-1.5" />
              Resume Checkout
            </Button>
          )}

          {(partsStatus === 'ordered' || partsStatus === 'parts_arranged') && (
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
