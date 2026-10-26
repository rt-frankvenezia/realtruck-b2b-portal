'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShoppingCart, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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

export function PlaceOrderPanel({
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  const canOrder = status === 'quote_sent'
  const isConverted = status === 'converted'

  if (!canOrder && !isConverted) return null

  // Custom items (surcharges, installation, etc.) are excluded from the wholesale
  // order — those are dealer-to-customer pricing only.
  const capItems = lineItems.filter((li) => li.type === 'base' || li.type === 'option')
  const customItems = lineItems.filter((li) => li.type === 'custom')
  const baseItem = capItems.find((li) => li.type === 'base') ?? capItems[0]
  const optionItems = capItems.filter((li) => li !== baseItem)
  const subtotal = capItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
  const vehicle = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ')

  function handlePlaceOrder() {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('place_leer_fiberglass_order', {
        p_quote_id: quoteId,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setOrderNumber((data as any)?.order_number ?? null)
      toast.success('Wholesale order placed successfully')
      router.refresh()
    })
  }

  if (isConverted) {
    return (
      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">{brand}</span>
            <h2 className="font-semibold text-white">Wholesale Order</h2>
            <span className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              <CheckCircle2 size={11} />
              Converted
            </span>
          </div>
        </div>
        <div className={PANEL_BODY}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                This quote has been converted to a wholesale order.
                {orderNumber && (
                  <> Order <span className="font-mono font-medium text-foreground">{orderNumber}</span> is now processing.</>
                )}
              </p>
            </div>
            <Link
              href="/dealer/orders"
              className="shrink-0 rounded border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              View Orders →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={PANEL}>
      <div className={PANEL_HEADER}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">{brand}</span>
          <h2 className="font-semibold text-white">Place Wholesale Order</h2>
        </div>
      </div>
      <div className={PANEL_BODY}>
        <div className="flex flex-col gap-4">
          {/* Order summary — cap items only */}
          <div className="divide-y divide-[#d5d5d5] rounded border border-[#d5d5d5]">
            <div className="flex items-center justify-between bg-muted/40 px-4 py-2">
              <div className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item</div>
              <div className="w-24 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dealer Price</div>
            </div>

            {baseItem && (
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{baseItem.description}</p>
                  {baseItem.sku && (
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{baseItem.sku}</p>
                  )}
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

          {/* Custom items excluded notice */}
          {customItems.length > 0 && (
            <div className="flex items-start gap-2 rounded border border-[#e8e8e8] bg-[#f8f8f8] px-3 py-2.5">
              <Info size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{customItems.length} custom line item{customItems.length > 1 ? 's' : ''}</span> from this quote (surcharges, installation, etc.) are not included in the wholesale order. Those are part of the dealer-to-customer price only.
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

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Placing this order submits the wholesale cap request to RealTruck and converts the quote.
            </p>
            <Button
              onClick={handlePlaceOrder}
              disabled={isPending}
              className="shrink-0 bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
            >
              <ShoppingCart size={14} className="mr-1.5" />
              Place Wholesale Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
