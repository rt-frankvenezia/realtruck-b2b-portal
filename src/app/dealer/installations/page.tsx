import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DEALER_STATUS_LABEL, DEALER_STATUS_VARIANT, formatCurrency, formatDate } from '@/lib/status-labels'

export default async function DealerInstallationsPage() {
  const supabase = await createClient()
  const { data: installations } = await supabase
    .from('installations')
    .select('id, order_number, customer_name, dealer_status, cap_model, scheduled_installation_date, msrp')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Installations</h1>
        <p className="text-muted-foreground">Track every order from scheduling through verification and payout.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cap Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">MSRP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(installations ?? []).map((installation) => (
                <TableRow key={installation.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/dealer/installations/${installation.id}`} className="font-medium hover:underline">
                      {installation.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{installation.customer_name}</TableCell>
                  <TableCell>{installation.cap_model ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={DEALER_STATUS_VARIANT[installation.dealer_status]}>
                      {DEALER_STATUS_LABEL[installation.dealer_status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(installation.scheduled_installation_date)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(installation.msrp)}</TableCell>
                </TableRow>
              ))}
              {(installations ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No installations yet.
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
