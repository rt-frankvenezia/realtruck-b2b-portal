import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderProgressStepper } from '@/components/shared/OrderProgressStepper'
import { PRODUCT_ORDER_STATUS_LABEL, formatDate } from '@/lib/status-labels'

export default async function OrderHistoryPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase.from('product_orders').select('*').order('order_date', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Order History</h1>
        <p className="text-muted-foreground">Orders you&apos;ve placed with RealTruck for customer fulfillment.</p>
      </div>

      <div className="flex flex-col gap-4">
        {(orders ?? []).map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
                    {order.status === 'delivered'
                      ? `Delivered — ${formatDate(order.estimated_delivery_date)}`
                      : `Order ${PRODUCT_ORDER_STATUS_LABEL[order.status]}`}
                  </p>
                  <OrderProgressStepper status={order.status} />
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {order.status === 'delivered'
                    ? ''
                    : order.status === 'in_transit'
                      ? 'Estimated delivery pending'
                      : 'Delivery date is pending'}
                </p>
              </div>

              <div className="flex items-end justify-between gap-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">Order Date: </span>
                    <span className="font-medium">{formatDate(order.order_date)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order Number: </span>
                    <span className="font-medium">{order.order_number}</span>
                  </div>
                  {order.po_number && (
                    <div>
                      <span className="text-muted-foreground">PO Number: </span>
                      <span className="font-medium">{order.po_number}</span>
                    </div>
                  )}
                  {order.customer_name && (
                    <div>
                      <span className="text-muted-foreground">Customer: </span>
                      <span className="font-medium">{order.customer_name}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {order.tracking_number && (
                    <Button size="sm" variant="outline" render={<Link href={`/dealer/orders/${order.id}`} />} nativeButton={false}>
                      Track Order
                    </Button>
                  )}
                  <Button size="sm" render={<Link href={`/dealer/orders/${order.id}`} />} nativeButton={false}>
                    View Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(orders ?? []).length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">No orders yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
