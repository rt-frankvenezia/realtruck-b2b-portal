import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_VARIANT } from '@/lib/status-labels'

function formatAge(createdAt: string): { text: string; dot: 'none' | 'warning' | 'critical' } {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  if (hours < 24) return { text: `${Math.round(hours)}h`, dot: 'none' }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return { text: `${days}d`, dot: days <= 2 ? 'warning' : 'critical' }
  }
  return { text: `${Math.floor(days / 7)}w`, dot: 'warning' }
}

function quoteDisplayNum(id: string): string {
  const n = parseInt(id.split('-').pop() ?? '0', 16)
  return `26-${71000 + (n % 1000)}`
}

export default async function AdminQuotesPage() {
  const supabase = await createClient()
  const [{ data: quotes }, { data: locations }, { data: companies }] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, customer_name, vehicle_year, vehicle_make, vehicle_model, status, created_at, location_id, company_id')
      .order('created_at', { ascending: false }),
    supabase.from('locations').select('id, code, name, city, state'),
    supabase.from('companies').select('id, name'),
  ])

  type LocRow = { id: string; code: string; name: string; city: string; state: string }
  type CompRow = { id: string; name: string }
  const locMap = new Map<string, LocRow>((locations ?? []).map((l: any) => [l.id as string, l as LocRow]))
  const compMap = new Map<string, CompRow>((companies ?? []).map((c: any) => [c.id as string, c as CompRow]))

  const rows = quotes ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Quote Management</h1>
        <p className="text-muted-foreground">Monitor and manage leads across all dealer locations.</p>
      </div>

      {/* Filters (represented) */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex min-w-40 flex-1 flex-col gap-1">
            <label className="text-xs text-muted-foreground">Search</label>
            <input
              readOnly
              placeholder="Search by customer name, email, or quote ID..."
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Dealer</label>
            <select disabled className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              <option>All Dealers</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Location</label>
            <select disabled className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              <option>All Locations</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <select disabled className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              <option>All Statuses</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Date Range</label>
            <select disabled className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              <option>Last 30 Days</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Customer Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((quote) => {
                const loc = quote.location_id ? locMap.get(quote.location_id) : null
                const company = quote.company_id ? compMap.get(quote.company_id) : null
                const age = formatAge(quote.created_at)
                return (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link href={`/dealer/quotes/${quote.id}`} className="font-medium hover:underline">
                        {quoteDisplayNum(quote.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={QUOTE_STATUS_VARIANT[quote.status]}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {age.dot !== 'none' && (
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${age.dot === 'warning' ? 'bg-orange-400' : 'bg-red-500'}`}
                          />
                        )}
                        {age.text}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{company?.name ?? '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{loc?.code ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {loc ? `${loc.city}, ${loc.state}` : '—'}
                    </TableCell>
                    <TableCell className="font-medium">{quote.customer_name}</TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No quotes found.
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
