import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OrderProgressStepper } from '@/components/shared/OrderProgressStepper'
import { PRODUCT_ORDER_STATUS_LABEL, formatCurrency, formatDate } from '@/lib/status-labels'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from('product_orders').select('*').eq('id', id).maybeSingle(),
    supabase.from('product_order_items').select('*').eq('product_order_id', id),
  ])

  if (!order) notFound()

  const { data: locationRow } = order.location_id
    ? await supabase.from('locations').select('name, address, city, state, postal_code').eq('id', order.location_id).maybeSingle()
    : { data: null }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/dealer/orders" className="text-sm text-muted-foreground hover:underline">
          ← Back to Order History
        </Link>
        <div className="flex gap-2">
          <Button variant="outline">Download Invoice</Button>
          {order.tracking_number && <Button>Track Package</Button>}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
          {order.status === 'delivered' ? `Delivered — ${formatDate(order.estimated_delivery_date)}` : `Order ${PRODUCT_ORDER_STATUS_LABEL[order.status]}`}
        </p>
        <OrderProgressStepper status={order.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <Field label="Order Date" value={formatDate(order.order_date)} />
          <Field label="Order Number" value={order.order_number} />
          <Field label="Payment Method" value={order.payment_method} />
          {order.tracking_number && <Field label="Tracking" value={order.tracking_number} />}
          <Field label="Est. Delivery" value={formatDate(order.estimated_delivery_date)} />
          {order.po_number && <Field label="PO Number" value={order.po_number} />}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dealer Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Location</p>
              <p className="font-medium">{locationRow?.name ?? '—'}</p>
              {locationRow && (
                <p className="text-muted-foreground">
                  {[locationRow.address, [locationRow.city, locationRow.state].filter(Boolean).join(', '), locationRow.postal_code]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Ordered By</p>
              <p className="font-medium">{order.ordered_by_name}</p>
              <p className="text-muted-foreground">{order.ordered_by_email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Field label="Name" value={order.customer_name} />
            <Field label="Email" value={order.customer_email} />
            <Field label="Phone" value={order.customer_phone} />
            <Field label="Vehicle" value={order.customer_vehicle} />
            <Field
              label="Shipping Address"
              value={
                [order.shipping_address, [order.shipping_city, order.shipping_state].filter(Boolean).join(', '), order.shipping_postal_code]
                  .filter(Boolean)
                  .join(', ') || null
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.product_name}</p>
                    {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end border-t p-4">
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between gap-8 text-base font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  )
}
