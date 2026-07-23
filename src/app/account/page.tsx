import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CUSTOMER_FACING_STATUS_LABEL, CUSTOMER_FACING_STATUS_VARIANT, formatDate } from '@/lib/status-labels'

export default async function AccountOrdersPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: installations } = await supabase
    .from('installations')
    .select('id, order_number, cap_model, order_date')
    .eq('customer_email', user!.email)
    .order('order_date', { ascending: false })

  const statuses = await Promise.all(
    (installations ?? []).map((i) => supabase.rpc('get_customer_facing_status', { p_installation_id: i.id }))
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="text-muted-foreground">Track every cap you&apos;ve ordered through RealTruck.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Cap Model</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(installations ?? []).map((installation, index) => {
                const status = statuses[index].data
                return (
                  <TableRow key={installation.id}>
                    <TableCell>
                      <Link href={`/account/orders/${installation.id}`} className="font-medium hover:underline">
                        {installation.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{installation.cap_model ?? '—'}</TableCell>
                    <TableCell>{formatDate(installation.order_date)}</TableCell>
                    <TableCell>
                      {status && <Badge variant={CUSTOMER_FACING_STATUS_VARIANT[status]}>{CUSTOMER_FACING_STATUS_LABEL[status]}</Badge>}
                    </TableCell>
                  </TableRow>
                )
              })}
              {(installations ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
