import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_VARIANT, formatDate } from '@/lib/status-labels'

export default async function DealerQuotesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, customer_name, vehicle_year, vehicle_make, vehicle_model, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Quotes</h1>
        <p className="text-muted-foreground">Leads from the 3D configurator, scoped to your dealership.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(quotes ?? []).map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <Link href={`/dealer/quotes/${quote.id}`} className="font-medium hover:underline">
                      {quote.customer_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={QUOTE_STATUS_VARIANT[quote.status]}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(quote.created_at)}</TableCell>
                </TableRow>
              ))}
              {(quotes ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No quotes yet.
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
