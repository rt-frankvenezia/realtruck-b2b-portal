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
  const [{ data: bankAccounts }, { data: paymentCards }] = await Promise.all([
    usingTerms
      ? Promise.resolve({ data: null })
      : supabase
          .from('bank_accounts')
          .select('id, bank_name, last_four, is_default')
          .eq('company_id', user.profile.company_id)
          .eq('verification_status', 'verified')
          .order('is_default', { ascending: false }),
    usingTerms
      ? Promise.resolve({ data: null })
      : supabase
          .from('payment_cards')
          .select('id, card_brand, last_four, is_default')
          .eq('company_id', user.profile.company_id)
          .eq('status', 'active')
          .order('is_default', { ascending: false }),
  ])

  return (
    <CheckoutForm
      companyId={user.profile.company_id}
      companyName={company?.name ?? ''}
      locations={locations ?? []}
      creditAccount={creditAccount ?? null}
      bankAccounts={bankAccounts ?? []}
      paymentCards={paymentCards ?? []}
    />
  )
}
