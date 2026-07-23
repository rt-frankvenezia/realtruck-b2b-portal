import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InstallationKPIDashboard } from '@/components/shared/InstallationKPIDashboard'

const TIER_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  needs_attention: 'Needs Attention',
  critical: 'Critical',
  inactive: 'Inactive',
}

const TIER_VARIANT: Record<string, 'success' | 'secondary' | 'destructive' | 'outline'> = {
  healthy: 'success',
  needs_attention: 'secondary',
  critical: 'destructive',
  inactive: 'outline',
}

const FLAG_LABEL: Record<string, string> = {
  sla_breach_critical: 'SLA breach (critical)',
  sla_breach_warning: 'SLA breach (warning)',
  quote_backlog_critical: 'Quote backlog (critical)',
  quote_backlog_warning: 'Quote backlog (warning)',
  orphaned_quotes: 'Orphaned quotes',
  no_location_admin: 'No active location admin',
  no_active_users: 'No active users',
  inactive_users: 'All users inactive 30+ days',
  company_suspended: 'Company suspended/closed',
}

export default async function AdminOversightPage() {
  const supabase = await createClient()
  const [{ data: health }, { data: kpi }] = await Promise.all([
    supabase.rpc('admin_dealer_health'),
    supabase.rpc('installation_kpi_metrics'),
  ])
  const metrics = kpi?.[0]

  const tierOrder = ['critical', 'needs_attention', 'inactive', 'healthy']
  const sorted = [...(health ?? [])].sort((a, b) => tierOrder.indexOf(a.health_tier) - tierOrder.indexOf(b.health_tier))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dealer Oversight</h1>
        <p className="text-muted-foreground">Health at a glance across every dealer company.</p>
      </div>

      {metrics && <InstallationKPIDashboard metrics={metrics} showPayouts showMacro />}

      <div>
        <h2 className="text-lg font-semibold">Quote & Response Health</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {tierOrder.map((tier) => (
          <Card key={tier}>
            <CardHeader>
              <CardDescription>{TIER_LABEL[tier]}</CardDescription>
              <CardTitle className="text-3xl">{sorted.filter((c) => c.health_tier === tier).length}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Open Quotes</TableHead>
                <TableHead>Aged Quotes</TableHead>
                <TableHead>SLA Compliance</TableHead>
                <TableHead>Active Users</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((company) => (
                <TableRow key={company.company_id}>
                  <TableCell>
                    <Link href={`/admin/companies/${company.company_id}`} className="font-medium hover:underline">
                      {company.company_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TIER_VARIANT[company.health_tier]}>{TIER_LABEL[company.health_tier]}</Badge>
                  </TableCell>
                  <TableCell>{company.open_quotes}</TableCell>
                  <TableCell>{company.aged_quotes}</TableCell>
                  <TableCell>{company.sla_compliance_pct}%</TableCell>
                  <TableCell>
                    {company.active_user_count} / {company.total_user_count}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(company.flags ?? []).map((flag: string) => (
                        <Badge key={flag} variant="outline" className="text-xs">
                          {FLAG_LABEL[flag] ?? flag}
                        </Badge>
                      ))}
                    </div>
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
