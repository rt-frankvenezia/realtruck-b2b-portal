import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type KpiRow = Database['public']['Functions']['installation_kpi_metrics']['Returns'][number]

export function InstallationKPIDashboard({
  metrics,
  showPayouts,
  showMacro,
}: {
  metrics: KpiRow
  showPayouts: boolean
  showMacro: boolean
}) {
  const overdueTotal =
    metrics.no_scheduling_attempt_overdue +
    metrics.cap_arrived_overdue +
    metrics.documentation_overdue +
    metrics.customer_confirmation_overdue

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Installation Pipeline</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Today" value={metrics.todays_installations} />
          <Stat label="This Week" value={metrics.scheduled_this_week} />
          <Stat label="Awaiting Scheduling" value={metrics.awaiting_scheduling} />
          <Stat label="Awaiting Docs" value={metrics.awaiting_documentation} />
          <Stat label="Awaiting Confirmation" value={metrics.awaiting_customer_confirmation} />
          <Stat label="Issues Reported" value={metrics.issues_reported} warn={metrics.issues_reported > 0} />
          <Stat label="Completed (30d)" value={metrics.completed_last_30_days} />
        </div>
      </div>

      {showPayouts && (
        <div>
          <h2 className="text-lg font-semibold">Payout Summary</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Estimated Payout (Unpaid)</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(metrics.estimated_payout)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Next Scheduled Payout</CardDescription>
                <CardTitle className="text-2xl">{formatDate(metrics.next_payout_date)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Year-to-Date Payouts</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(metrics.ytd_payouts)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Payout Blocked — Pending Confirmation</CardDescription>
                <CardTitle className="text-2xl">{metrics.awaiting_customer_confirmation}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      )}

      {overdueTotal > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-destructive">Overdue Alerts</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {metrics.no_scheduling_attempt_overdue > 0 && (
              <AlertStat label="No Scheduling Attempt (3+ days)" value={metrics.no_scheduling_attempt_overdue} />
            )}
            {metrics.cap_arrived_overdue > 0 && <AlertStat label="Cap Sitting at Dealer (7+ days)" value={metrics.cap_arrived_overdue} />}
            {metrics.documentation_overdue > 0 && (
              <AlertStat label="Documentation Overdue (2+ days)" value={metrics.documentation_overdue} />
            )}
            {metrics.customer_confirmation_overdue > 0 && (
              <AlertStat label="Confirmation Pending (7+ days)" value={metrics.customer_confirmation_overdue} />
            )}
          </div>
        </div>
      )}

      {showMacro && (
        <div>
          <h2 className="text-lg font-semibold">System-Wide Performance</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Installations" value={metrics.total_installations} />
            <Stat label="Avg Arrival → Scheduled" value={formatDays(metrics.avg_arrival_to_scheduled)} />
            <Stat label="Avg Scheduled → Completed" value={formatDays(metrics.avg_scheduled_to_completed)} />
            <Stat label="Avg Completed → Confirmed" value={formatDays(metrics.avg_completed_to_confirmed)} />
            <Stat label="Issue Rate" value={`${Number(metrics.issue_rate ?? 0).toFixed(1)}%`} />
          </div>
        </div>
      )}
    </div>
  )
}

function formatDays(value: number | null): string {
  if (value === null) return '—'
  return `${Number(value).toFixed(1)}d`
}

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-2xl ${warn ? 'text-destructive' : ''}`}>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function AlertStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl text-destructive">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
