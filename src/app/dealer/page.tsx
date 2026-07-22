import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/status-labels'

export default async function DealerDashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const [openQuotes, activeInstallations, pendingPayouts] = await Promise.all([
    supabase.from('quotes').select('id', { count: 'exact', head: true }).in('status', ['new', 'working', 'quote_sent']),
    supabase.from('installations').select('id', { count: 'exact', head: true }).not('dealer_status', 'in', '(completed,cancelled)'),
    supabase.from('payouts').select('payout_amount').eq('status', 'pending'),
  ])

  const pendingPayoutTotal = (pendingPayouts.data ?? []).reduce((sum, p) => sum + Number(p.payout_amount), 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.profile.name}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening across your dealership.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Open Quotes</CardDescription>
            <CardTitle className="text-3xl">{openQuotes.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Installations</CardDescription>
            <CardTitle className="text-3xl">{activeInstallations.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending Payouts</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(pendingPayoutTotal)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting around</CardTitle>
          <CardDescription>
            Use the sidebar to review quotes, manage installations end-to-end (scheduling → verification → payout), and
            track payouts and warranty registrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.profile.role.replace('_', ' ')}</span>
          {user?.profile.company_id ? ' at your dealership.' : '.'}
        </CardContent>
      </Card>
    </div>
  )
}
