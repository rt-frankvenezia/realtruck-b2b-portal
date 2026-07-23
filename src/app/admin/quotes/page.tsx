import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminQuoteEditDialog } from '@/components/admin/AdminQuoteEditDialog'
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_VARIANT, formatDate } from '@/lib/status-labels'

type SlaStatus = 'on_time' | 'warning' | 'critical'

const SLA_LABEL: Record<SlaStatus, string> = { on_time: 'On Time', warning: 'Warning', critical: 'Critical' }
const SLA_VARIANT: Record<SlaStatus, 'success' | 'secondary' | 'destructive'> = {
  on_time: 'success',
  warning: 'secondary',
  critical: 'destructive',
}

export default async function AdminQuotesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, locations(id, name, status), companies(id, name, status)')
    .order('created_at', { ascending: false })

  const rows = (quotes ?? []).map((quote) => {
    const ageHours = (Date.now() - new Date(quote.created_at).getTime()) / 3_600_000
    const slaStatus: SlaStatus = quote.status !== 'new' ? 'on_time' : ageHours > 72 ? 'critical' : ageHours > 24 ? 'warning' : 'on_time'

    let orphaned = false
    let orphanedReason: string | null = null
    if (!quote.location_id) {
      orphaned = true
      orphanedReason = 'No location assigned'
    } else if (quote.locations?.status === 'closed') {
      orphaned = true
      orphanedReason = 'Location is closed'
    } else if (quote.companies && quote.companies.status !== 'active') {
      orphaned = true
      orphanedReason = `Company is ${quote.companies.status}`
    }

    return { quote, ageHours, slaStatus, orphaned, orphanedReason }
  })

  const stats = {
    total: rows.length,
    orphaned: rows.filter((r) => r.orphaned).length,
    critical: rows.filter((r) => r.slaStatus === 'critical').length,
    warning: rows.filter((r) => r.slaStatus === 'warning').length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Quote Oversight</h1>
        <p className="text-muted-foreground">SLA and orphaned-quote monitoring across every dealer.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Orphaned</CardDescription>
            <CardTitle className="text-3xl">{stats.orphaned}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>SLA Critical</CardDescription>
            <CardTitle className="text-3xl">{stats.critical}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>SLA Warning</CardDescription>
            <CardTitle className="text-3xl">{stats.warning}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Orphaned</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ quote, slaStatus, orphaned, orphanedReason }) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.customer_name}</TableCell>
                  <TableCell>{quote.companies?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={QUOTE_STATUS_VARIANT[quote.status]}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SLA_VARIANT[slaStatus]}>{SLA_LABEL[slaStatus]}</Badge>
                  </TableCell>
                  <TableCell>
                    {orphaned ? (
                      <Badge variant="destructive" title={orphanedReason ?? undefined}>
                        {orphanedReason}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{formatDate(quote.created_at)}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Link href={`/dealer/quotes/${quote.id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                    <AdminQuoteEditDialog quote={quote} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
