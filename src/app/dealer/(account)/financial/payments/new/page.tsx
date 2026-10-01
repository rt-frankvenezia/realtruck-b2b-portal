import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Button } from '@/components/ui/button'
import { MakePaymentForm } from '@/components/dealer/financial/MakePaymentForm'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>
}) {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'pay_invoices')) redirect('/dealer')

  const { invoice: preselectedInvoiceId } = await searchParams
  const supabase = await createClient()

  const [{ data: invoices }, { data: bankAccounts }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*')
      .eq('company_id', user.profile.company_id)
      .in('status', ['open', 'past_due'])
      .gt('remaining_balance', 0)
      .order('due_date'),
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', user.profile.company_id)
      .eq('verification_status', 'verified')
      .order('is_default', { ascending: false }),
  ])

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Make a Payment</h1>
        <div className={PANEL}>
          <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
            <p className="text-sm text-muted-foreground">You do not have any open invoices eligible for payment.</p>
            <Button variant="outline" render={<Link href="/dealer/financial/invoices" />} nativeButton={false}>
              View Invoices
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MakePaymentForm
      companyId={user.profile.company_id}
      invoices={invoices}
      bankAccounts={bankAccounts ?? []}
      preselectedInvoiceId={preselectedInvoiceId}
    />
  )
}
