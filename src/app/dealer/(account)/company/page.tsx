import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { CompanyBillingForm } from '@/components/dealer/CompanyBillingForm'
import { COMPANY_STATUS_LABEL, COMPANY_STATUS_VARIANT } from '@/lib/status-labels'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

export default async function DealerCompanyPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!user?.profile.company_id) notFound()

  const [{ data: company }, { data: pricingGroup }, { count: locationCount }, { count: userCount }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', user.profile.company_id).single(),
    supabase.from('companies').select('pricing_groups(name)').eq('id', user.profile.company_id).single(),
    supabase.from('locations').select('id', { count: 'exact', head: true }).eq('company_id', user.profile.company_id),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('company_id', user.profile.company_id),
  ])

  if (!company) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-muted-foreground">Code: {company.code}</p>
        </div>
        <Badge variant={COMPANY_STATUS_VARIANT[company.status]}>{COMPANY_STATUS_LABEL[company.status]}</Badge>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Overview</h2>
          <p className="text-sm text-white/70">Company code, status, and A.R.E. dealer designation are managed by RealTruck.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">A.R.E. Dealer</p>
            <p>{company.is_are_dealer ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Pricing Group</p>
            <p>{pricingGroup?.pricing_groups?.name ?? 'None assigned'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Locations</p>
            <p>{locationCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Users</p>
            <p>{userCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Billing Address</h2>
          <p className="text-sm text-white/70">Editable by your dealer admin.</p>
        </div>
        <div className={PANEL_BODY}>
          <CompanyBillingForm company={company} />
        </div>
      </div>
    </div>
  )
}
