import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/dealer/CheckoutForm'

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.profile.company_id) redirect('/dealer/shop')

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

  // Only needed for the Card/ACH branch — a terms account never sees
  // those tabs, so skip fetching stored methods entirely in that case.
  const usingTerms = Boolean(creditAccount)
  const { data: rawSavedMethods } = usingTerms
    ? { data: null }
    : await supabase
        .from('saved_payment_methods')
        .select('*, saved_payment_method_locations(location_id)')
        .eq('company_id', user.profile.company_id)
        .order('created_at')

  const savedMethods = (rawSavedMethods ?? []).map((m) => ({
    id: m.id,
    type: m.type,
    label: m.label,
    display_info: m.display_info as Record<string, string | boolean>,
    location_scope: m.location_scope,
    location_ids: m.saved_payment_method_locations.map((l) => l.location_id),
  }))

  return (
    <CheckoutForm
      companyId={user.profile.company_id}
      companyName={company?.name ?? ''}
      locations={locations ?? []}
      creditAccount={creditAccount ?? null}
      savedMethods={savedMethods}
    />
  )
}
