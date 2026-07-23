import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { InstallationKPIDashboard } from '@/components/shared/InstallationKPIDashboard'

export default async function DealerDashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: kpi } = await supabase.rpc('installation_kpi_metrics')
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
    </div>
  )
}
