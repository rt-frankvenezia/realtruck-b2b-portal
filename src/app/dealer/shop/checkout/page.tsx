import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/dealer/CheckoutForm'

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer/shop')

  const supabase = await createClient()

  const [{ data: locations }, { data: company }, { data: creditAccount }] = await Promise.all([
    supabase.from('locations').select('id, name, address, city, state, postal_code').eq('company_id', user.profile.company_id).eq('status', 'active').order('name'),
    supabase.from('companies').select('name').eq('id', user.profile.company_id).single(),
    supabase
      .from('credit_accounts')
      .select('status, available_credit, payment_terms')
      .eq('company_id', user.profile.company_id)
      .in('status', ['active', 'on_hold'])
      .maybeSingle(),
  ])

  return (
    <CheckoutForm
      companyId={user.profile.company_id}
      companyName={company?.name ?? ''}
      locations={locations ?? []}
      creditAccount={creditAccount ?? null}
    />
  )
}
