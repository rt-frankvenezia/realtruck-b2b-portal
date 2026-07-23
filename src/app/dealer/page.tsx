import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InstallationKPIDashboard } from '@/components/shared/InstallationKPIDashboard'
import { OrderProgressStepper } from '@/components/shared/OrderProgressStepper'
import { formatDate } from '@/lib/status-labels'

export default async function DealerDashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const [{ data: kpi }, { data: recentOrders }] = await Promise.all([
    supabase.rpc('installation_kpi_metrics'),
    supabase.from('product_orders').select('*').order('order_date', { ascending: false }).limit(3),
  ])
  const metrics = kpi?.[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.profile.name}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening across your dealership.</p>
      </div>

      {metrics && (
        <InstallationKPIDashboard
          metrics={metrics}
          showPayouts={user?.profile.role !== 'staff'}
          showMacro={user?.profile.role === 'realtruck_admin'}
        />
      )}

      {(recentOrders ?? []).length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/dealer/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {(recentOrders ?? []).map((order) => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div className="flex-1">
                    <OrderProgressStepper status={order.status} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {order.order_number} · {formatDate(order.order_date)} {order.customer_name ? `· ${order.customer_name}` : ''}
                    </p>
                  </div>
                  <Button size="sm" render={<Link href={`/dealer/orders/${order.id}`} />} nativeButton={false}>
                    View Order
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
