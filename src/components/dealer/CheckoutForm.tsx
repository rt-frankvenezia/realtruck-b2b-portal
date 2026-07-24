'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Building2, Lock, Receipt, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/status-labels'

type Location = { id: string; name: string; address: string | null; city: string | null; state: string | null; postal_code: string | null }
type CreditAccount = { status: string; available_credit: number | null; payment_terms: string | null } | null

const TAX_RATE = 0.0835
const SHIPPING_COST: Record<string, number> = { standard: 0, expedited: 75 }

export function CheckoutForm({
  companyId,
  companyName,
  locations,
  creditAccount,
}: {
  companyId: string
  companyName: string
  locations: Location[]
  creditAccount: CreditAccount
}) {
  const router = useRouter()
  const { items, subtotal, clear } = useDealerCart()
  const [isPending, startTransition] = useTransition()

  const [locationId, setLocationId] = useState(locations[0]?.id ?? '')
  const [poNumber, setPoNumber] = useState('')
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'expedited'>('standard')
  const [paymentTab, setPaymentTab] = useState<'card' | 'ach' | 'terms'>('card')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [reviewEligible, setReviewEligible] = useState(false)

  const shipping = SHIPPING_COST[shippingMethod]
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const total = subtotal + shipping + tax

  const selectedLocation = locations.find((l) => l.id === locationId)

  function submitOrder(requestReview: boolean) {
    setCheckoutError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('place_wholesale_order', {
        p_company_id: companyId,
        p_location_id: locationId,
        p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        p_po_number: poNumber || undefined,
        p_payment_method: paymentTab === 'card' ? 'Credit Card (mock)' : paymentTab === 'ach' ? 'Business Checking (mock)' : undefined,
        p_use_terms: paymentTab === 'terms',
        p_request_review: requestReview,
        p_shipping_address: selectedLocation?.address ?? undefined,
        p_shipping_city: selectedLocation?.city ?? undefined,
        p_shipping_state: selectedLocation?.state ?? undefined,
        p_shipping_postal_code: selectedLocation?.postal_code ?? undefined,
      })

      if (error) {
        setCheckoutError(error.message)
        setReviewEligible(!requestReview && (error.message.includes('insufficient_credit') || error.message.includes('credit_hold')))
        return
      }

      clear()
      toast.success('Order submitted')
      router.push(`/dealer/shop/confirmation/${data.id}`)
    })
  }

  const canSubmit = items.length > 0 && !!locationId && !isPending

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
                    onChange={(e) => setLocationId(e.target.value)}
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
                <Tabs value={paymentTab} onValueChange={(v) => setPaymentTab(v as typeof paymentTab)}>
                  <TabsList>
                    <TabsTrigger value="card">Card</TabsTrigger>
                    <TabsTrigger value="ach">ACH</TabsTrigger>
                    {creditAccount && <TabsTrigger value="terms">Pay on Terms</TabsTrigger>}
                  </TabsList>
                  <TabsContent value="card" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      A saved card payment method would be selected here. This prototype does not process real card payments.
                    </p>
                  </TabsContent>
                  <TabsContent value="ach" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      A saved ACH bank account would be selected here. This prototype does not process real ACH debits.
                    </p>
                  </TabsContent>
                  {creditAccount && (
                    <TabsContent value="terms" className="mt-4">
                      <div className="flex flex-col gap-3">
                        <div className="rounded-md border bg-muted/40 p-4">
                          <div className="flex items-start gap-3">
                            <Receipt size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
                            <div>
                              <h4 className="text-sm font-bold">
                                Credit Account — {creditAccount.payment_terms?.replace('_', '-').toUpperCase() ?? 'Terms'}
                              </h4>
                              <p className="text-xs text-muted-foreground">Payment due per your assigned terms from invoice date.</p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="rounded-md bg-background p-3">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">Available Credit</div>
                              <div className={`text-base font-bold ${(creditAccount.available_credit ?? 0) >= total ? 'text-green-600' : 'text-destructive'}`}>
                                {formatCurrency(creditAccount.available_credit ?? 0)}
                              </div>
                            </div>
                            {creditAccount.status === 'on_hold' && (
                              <div className="col-span-2 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                                <AlertTriangle size={14} />
                                This account is currently on credit hold.
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Credit is checked against your available balance when the order is submitted.
                        </p>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>

            {checkoutError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {checkoutError}
                  {reviewEligible && (
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => submitOrder(true)} disabled={isPending}>
                        Request Manual Review Instead
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button size="lg" className="w-full" disabled={!canSubmit} onClick={() => submitOrder(false)}>
              <Lock size={16} />
              Submit Order
            </Button>
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
