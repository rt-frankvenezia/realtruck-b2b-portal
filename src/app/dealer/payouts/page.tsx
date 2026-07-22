import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_VARIANT, formatCurrency, formatDate } from '@/lib/status-labels'

export default async function DealerPayoutsPage() {
  const supabase = await createClient()
  const { data: payouts } = await supabase
    .from('payouts')
    .select('id, payout_amount, status, scheduled_date, paid_date, installations(order_number, customer_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="text-muted-foreground">Created automatically once an installation is completed and confirmed.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payouts ?? []).map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium">{payout.installations?.order_number}</TableCell>
                  <TableCell>{payout.installations?.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant={PAYOUT_STATUS_VARIANT[payout.status]}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(payout.scheduled_date)}</TableCell>
                  <TableCell>{formatDate(payout.paid_date)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payout.payout_amount)}</TableCell>
                </TableRow>
              ))}
              {(payouts ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No payouts yet.
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
