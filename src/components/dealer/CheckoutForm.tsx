'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Building2, CheckCircle2, CreditCard, Landmark, Loader2, Lock, Receipt, RotateCcw, ShieldAlert, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type Location = { id: string; name: string; address: string | null; city: string | null; state: string | null; postal_code: string | null }
type CreditAccount = { status: string; available_credit: number | null; payment_terms: string | null } | null
type ValidationResult = Database['public']['CompositeTypes']['credit_validation_result']
type SavedMethodOption = {
  id: string
  type: 'card' | 'bank_account'
  label: string | null
  display_info: Record<string, string | boolean>
  location_scope: 'all' | 'selected'
  location_ids: string[]
}

const TAX_RATE = 0.0835
const SHIPPING_COST: Record<string, number> = { standard: 0, expedited: 75 }

export function CheckoutForm({
  companyId,
  companyName,
  locations,
  creditAccount,
  savedMethods,
}: {
  companyId: string
  companyName: string
  locations: Location[]
  creditAccount: CreditAccount
  savedMethods: SavedMethodOption[]
}) {
  const router = useRouter()
  const { items, subtotal, clear } = useDealerCart()
  const [isPending, startTransition] = useTransition()

  // Docs 01 §3.3 / 02 §13: an account on credit terms always pays on terms
  // for eligible orders — credit-card checkout is not shown at all, not
  // just de-emphasized. There's nothing to pick between in that case, so
  // this is a fixed boolean, not a tab the dealer can switch away from.
  const usingTerms = Boolean(creditAccount)

  const [locationId, setLocationId] = useState(locations[0]?.id ?? '')
  const [locationChangedCleared, setLocationChangedCleared] = useState(false)

  // Compute methods valid for the currently selected location.
  const validMethods = savedMethods.filter(
    (m) => m.location_scope === 'all' || m.location_ids.includes(locationId)
  )
  const [selectedMethodId, setSelectedMethodId] = useState(validMethods[0]?.id ?? '')

  const [poNumber, setPoNumber] = useState('')
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'expedited'>('standard')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const [preview, setPreview] = useState<ValidationResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewNonce, setPreviewNonce] = useState(0)

  const shipping = SHIPPING_COST[shippingMethod]
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const total = subtotal + shipping + tax

  const selectedLocation = locations.find((l) => l.id === locationId)

  // Docs 02 §13: "Display available credit before submission, when
  // appropriate" — check credit as soon as the terms tab is active rather
  // than waiting for a failed submit to tell the dealer what will happen.
  useEffect(() => {
    if (!usingTerms || total <= 0) {
      setPreview(null)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    const supabase = createClient()
    supabase.rpc('validate_order_credit', { p_company_id: companyId, p_order_total: total }).then(({ data, error }) => {
      if (cancelled) return
      setPreviewLoading(false)
      if (error) {
        setPreview({
          outcome: 'service_unavailable',
          order_total: total,
          available_credit: null,
          amount_over_limit: null,
          hold_reason: null,
          dealer_message: null,
          review_request_allowed: false,
        })
        return
      }
      setPreview(data)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingTerms, total, companyId, previewNonce])

  function paymentMethodDescription(): string | undefined {
    if (usingTerms) return undefined
    const method = validMethods.find((m) => m.id === selectedMethodId)
    if (!method) return undefined
    const info = method.display_info
    if (method.type === 'card') return `Card — ${info.brand as string} •••• ${info.last4 as string}`
    return `ACH — ${info.bank as string} •••• ${info.last4 as string}`
  }

  function handleLocationChange(newLocationId: string) {
    setLocationId(newLocationId)
    // Check if the currently selected method is still valid for the new location
    const stillValid = savedMethods.some(
      (m) =>
        m.id === selectedMethodId &&
        (m.location_scope === 'all' || m.location_ids.includes(newLocationId))
    )
    if (selectedMethodId && !stillValid) {
      // Auto-select the first valid method for the new location, if any
      const firstValid = savedMethods.find(
        (m) => m.location_scope === 'all' || m.location_ids.includes(newLocationId)
      )
      setSelectedMethodId(firstValid?.id ?? '')
      setLocationChangedCleared(true)
    } else {
      setLocationChangedCleared(false)
    }
  }

  function submitOrder(requestReview: boolean) {
    setCheckoutError(null)
    startTransition(async () => {
      const supabase = createClient()

      // Server-side restriction check before placing the order.
      // This catches restricted items even if they reached the cart via another path.
      const { data: restrictionResults, error: restrictionError } = await supabase.rpc('validate_cart_restrictions', {
        p_company_id: companyId,
        p_items: items.map((i) => ({ product_id: i.productId })),
      })
      if (restrictionError) {
        setCheckoutError('Unable to validate your cart. Please try again.')
        return
      }
      const blockedItems = (restrictionResults ?? []).filter((r) => r.access === 'not_allowed')
      if (blockedItems.length > 0) {
        const names = blockedItems.map((r) => r.product_name).join(', ')
        setCheckoutError(`Your cart contains items not available for purchase with your dealer account: ${names}. Please remove them to continue.`)
        return
      }

      const { data, error } = await supabase.rpc('place_wholesale_order', {
        p_company_id: companyId,
        p_location_id: locationId,
        p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        p_po_number: poNumber || undefined,
        p_payment_method: paymentMethodDescription(),
        p_use_terms: usingTerms,
        p_request_review: requestReview,
        p_shipping_address: selectedLocation?.address ?? undefined,
        p_shipping_city: selectedLocation?.city ?? undefined,
        p_shipping_state: selectedLocation?.state ?? undefined,
        p_shipping_postal_code: selectedLocation?.postal_code ?? undefined,
      })

      if (error) {
        setCheckoutError(error.message)
        return
      }

      clear()
      toast.success('Order submitted')
      router.push(`/dealer/shop/confirmation/${data.id}`)
    })
  }

  const termsOutcome = usingTerms ? preview?.outcome : null
  const canSubmit =
    items.length > 0 &&
    !!locationId &&
    !isPending &&
    (usingTerms
      ? !previewLoading && termsOutcome === 'approved'
      : !!selectedMethodId)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-muted-foreground">Complete your order</p>
      </div>

      {items.length === 0 ? (
        <Alert>
          <AlertDescription>
            Your cart is empty. <Link href="/dealer/shop" className="font-semibold underline">Continue shopping</Link>.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div className="rounded-lg border">
              <div className="flex items-center gap-2 border-b px-6 py-4">
                <Building2 size={18} />
                <h2 className="font-semibold">Ordering Location</h2>
              </div>
              <div className="flex flex-col gap-4 px-6 py-4">
                <div>
                  <Label className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Company</Label>
                  <div className="text-sm font-semibold">{companyName}</div>
                </div>
                <div>
                  <Label htmlFor="location" className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Location
                  </Label>
                  <select
                    id="location"
                    value={locationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedLocation && (
                  <div>
                    <Label className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Shipping Address</Label>
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      <div>{selectedLocation.address}</div>
                      <div>
                        {selectedLocation.city}, {selectedLocation.state} {selectedLocation.postal_code}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="po-number" className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    PO Number (optional)
                  </Label>
                  <Input id="po-number" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-1234" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="flex items-center gap-2 border-b px-6 py-4">
                <Truck size={18} />
                <h2 className="font-semibold">Shipping Method</h2>
              </div>
              <div className="flex flex-col gap-3 px-6 py-4">
                {(['standard', 'expedited'] as const).map((method) => (
                  <label key={method} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === method}
                      onChange={() => setShippingMethod(method)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{method === 'standard' ? 'Standard Shipping' : 'Expedited Shipping'}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{method === 'standard' ? '5-7 business days' : '2-3 business days'}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatCurrency(SHIPPING_COST[method])}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="flex items-center gap-2 border-b px-6 py-4">
                <Lock size={18} />
                <h2 className="font-semibold">Payment Method</h2>
              </div>
              <div className="px-6 py-4">
                {!usingTerms ? (
                  <div className="flex flex-col gap-3">
                    {locationChangedCleared && (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Your previous payment method isn&apos;t available at this location. Please select another.
                      </p>
                    )}
                    {validMethods.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No saved payment methods for this location.{' '}
                        <Link href="/dealer/payment-methods" className="font-semibold underline">
                          Add one
                        </Link>{' '}
                        and set its availability to include this location.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {validMethods.map((m) => {
                          const info = m.display_info
                          const isCard = m.type === 'card'
                          const primaryLabel = m.label ?? (isCard
                            ? `${info.brand as string} •••• ${info.last4 as string}`
                            : `${info.bank as string} •••• ${info.last4 as string}`)
                          const subLabel = isCard
                            ? `${info.brand as string} •••• ${info.last4 as string} — Exp ${info.exp as string}`
                            : `${info.bank as string} (${info.account_type as string}) •••• ${info.last4 as string}`
                          return (
                            <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50">
                              <input
                                type="radio"
                                name="payment-method"
                                checked={selectedMethodId === m.id}
                                onChange={() => { setSelectedMethodId(m.id); setLocationChangedCleared(false) }}
                              />
                              {isCard
                                ? <CreditCard size={16} className="shrink-0 text-muted-foreground" />
                                : <Landmark size={16} className="shrink-0 text-muted-foreground" />
                              }
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold">{primaryLabel}</div>
                                {m.label && <div className="text-xs text-muted-foreground">{subLabel}</div>}
                              </div>
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {isCard ? 'Card' : 'ACH'}
                              </Badge>
                            </label>
                          )
                        })}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      <Link href="/dealer/payment-methods" className="underline">
                        Manage payment methods
                      </Link>
                    </p>
                  </div>
                ) : (
                  // Docs: an active-terms account never sees card/ACH as an
                  // option at all — this is the only payment method, so it's
                  // rendered directly rather than as one tab among others.
                  <div className="flex flex-col gap-3">
                    <div className="rounded-md border bg-muted/40 p-4">
                      <div className="flex items-start gap-3">
                        <Receipt size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-bold">
                            Credit Account — {creditAccount?.payment_terms?.replace('_', '-').toUpperCase() ?? 'Terms'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Payment due per your assigned terms from invoice date. This order will be invoiced, not
                            charged immediately.
                          </p>
                        </div>
                      </div>
                    </div>

                    {previewLoading && (
                      <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" />
                        Checking available credit…
                      </div>
                    )}

                    {!previewLoading && preview?.outcome === 'approved' && (
                      <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                        <div>
                          <div className="text-sm font-semibold text-green-900">Order approved on terms</div>
                          <div className="mt-1 text-xs text-green-800">
                            Available credit: {formatCurrency(preview.available_credit)}. Your order will follow the
                            normal fulfillment path and be invoiced per your terms.
                          </div>
                        </div>
                      </div>
                    )}

                    {!previewLoading && preview?.outcome === 'insufficient_credit' && (
                      <div className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
                          <div>
                            <div className="text-sm font-semibold text-destructive">Insufficient available credit</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              This order cannot be placed on terms as-is. You can return to your cart, pay down open
                              invoices to free up credit, or request a manual review.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <StatTile label="Order Total" value={formatCurrency(preview.order_total)} />
                          <StatTile label="Available Credit" value={formatCurrency(preview.available_credit)} />
                          <StatTile label="Amount Over Limit" value={formatCurrency(preview.amount_over_limit)} emphasis />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" render={<Link href="/dealer/shop/cart" />} nativeButton={false}>
                            Return to Cart
                          </Button>
                          <Button variant="outline" size="sm" render={<Link href="/dealer/financial/invoices?status=open" />} nativeButton={false}>
                            View and Pay Invoices
                          </Button>
                        </div>
                      </div>
                    )}

                    {!previewLoading && preview?.outcome === 'credit_hold' && (
                      <div className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
                        <div className="flex items-start gap-3">
                          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-destructive" />
                          <div>
                            <div className="text-sm font-semibold text-destructive">This account cannot currently place orders on terms</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {preview.hold_reason ?? preview.dealer_message ?? 'This account is on credit hold.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" render={<Link href="/dealer/financial/invoices?status=past_due" />} nativeButton={false}>
                            View Past-Due Invoices
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Contact your RealTruck sales representative or support at 877-123-4567 to resolve this hold.
                        </p>
                      </div>
                    )}

                    {!previewLoading && preview?.outcome === 'service_unavailable' && (
                      <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                          <p className="text-sm">
                            We could not validate the account&apos;s available credit. The order has not been
                            submitted. Please try again.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => setPreviewNonce((n) => n + 1)}>
                          <RotateCcw size={14} />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {checkoutError && (
              <Alert variant="destructive">
                <AlertDescription>{checkoutError}</AlertDescription>
              </Alert>
            )}

            {usingTerms && (termsOutcome === 'insufficient_credit' || termsOutcome === 'credit_hold') && preview?.review_request_allowed ? (
              <Button size="lg" className="w-full" disabled={isPending} onClick={() => submitOrder(true)}>
                Request Manual Review
              </Button>
            ) : (
              <Button size="lg" className="w-full" disabled={!canSubmit} onClick={() => submitOrder(false)}>
                <Lock size={16} />
                Submit Order
              </Button>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-lg border">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold">Order Summary</h2>
              </div>
              <div className="flex flex-col gap-3 border-b px-6 py-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.brand} • {item.sku} • Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="shrink-0 font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 px-6 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(shipping)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Order Total</span>
                    <span className="text-xl font-bold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-md bg-background p-3">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={`text-base font-bold ${emphasis ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  )
}
