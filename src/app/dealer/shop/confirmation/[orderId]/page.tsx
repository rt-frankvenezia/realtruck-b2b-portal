import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, CreditCard, MapPin, Package, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, PRODUCT_ORDER_STATUS_LABEL } from '@/lib/status-labels'

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase.from('product_orders').select('*, product_order_items(*)').eq('id', orderId).maybeSingle()
  if (!order) notFound()

  const isPendingReview = order.status === 'pending_credit_review'

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border p-8">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${isPendingReview ? 'bg-amber-100' : 'bg-green-100'}`}>
            <CheckCircle size={32} className={isPendingReview ? 'text-amber-700' : 'text-green-700'} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{isPendingReview ? 'Order Received — Pending Credit Review' : 'Order Confirmed'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isPendingReview
                ? 'Your order was received and is awaiting a manual credit review. Delivery timing is not guaranteed until it is released.'
                : 'Your order has been received and is being processed.'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Order Number</div>
                <div className="text-sm font-bold">{order.order_number}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Order Date</div>
                <div className="text-sm">{formatDate(order.order_date)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center gap-2">
          <Truck size={18} />
          <h2 className="font-semibold">Fulfillment Status</h2>
        </div>
        <div className="rounded-md border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <Package size={20} className="mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">{PRODUCT_ORDER_STATUS_LABEL[order.status]}</div>
              {!isPendingReview && order.estimated_delivery_date && (
                <div className="mt-1 text-xs text-muted-foreground">Estimated ship date: {formatDate(order.estimated_delivery_date)}</div>
              )}
              {isPendingReview && (
                <div className="mt-1 text-xs text-muted-foreground">
                  RealTruck will follow up once the order is released or if additional information is needed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Order Details</h2>
        </div>
        <div className="divide-y border-b">
          <div className="grid grid-cols-5 gap-4 bg-muted/40 px-6 py-3 text-xs font-semibold uppercase text-muted-foreground">
            <div className="col-span-2">Product</div>
            <div className="text-right">Unit Price</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Line Total</div>
          </div>
          {order.product_order_items.map((item) => (
            <div key={item.id} className="grid grid-cols-5 gap-4 px-6 py-4">
              <div className="col-span-2">
                <div className="text-sm font-semibold">{item.product_name}</div>
                {item.sku && <div className="text-xs font-mono text-muted-foreground">{item.sku}</div>}
              </div>
              <div className="text-right text-sm">{formatCurrency(item.price)}</div>
              <div className="text-center text-sm">{item.quantity}</div>
              <div className="text-right text-sm font-semibold">{formatCurrency(item.total)}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-end px-6 py-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Order Total</span>
                <span className="text-xl font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard size={18} />
            <h2 className="font-semibold">Payment Method</h2>
          </div>
          <div className="text-sm">{order.payment_method ?? '—'}</div>
          {order.po_number && <div className="mt-1 text-sm text-muted-foreground">PO: {order.po_number}</div>}
        </div>
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={18} />
            <h2 className="font-semibold">Shipping Address</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {order.shipping_address && <div>{order.shipping_address}</div>}
            <div>
              {[order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(', ')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-6">
        <div>
          <h3 className="font-semibold">What&apos;s Next?</h3>
          <p className="text-sm text-muted-foreground">Track your order status or return to your dashboard.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" render={<Link href="/dealer/orders" />} nativeButton={false}>
            View Order History
          </Button>
          <Button render={<Link href="/dealer" />} nativeButton={false}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
