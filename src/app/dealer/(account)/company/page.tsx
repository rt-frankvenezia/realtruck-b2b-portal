import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyBillingForm } from '@/components/dealer/CompanyBillingForm'
import { COMPANY_STATUS_LABEL, COMPANY_STATUS_VARIANT } from '@/lib/status-labels'

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

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Company code, status, and A.R.E. dealer designation are managed by RealTruck.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
          <CardDescription>Editable by your dealer admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyBillingForm company={company} />
        </CardContent>
      </Card>
    </div>
  )
}
