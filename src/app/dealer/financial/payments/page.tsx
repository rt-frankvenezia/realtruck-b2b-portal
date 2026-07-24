import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_VARIANT, formatCurrency, formatDate } from '@/lib/status-labels'

export default async function PaymentHistoryPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'view_payments')) redirect('/dealer')

  const supabase = await createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('*, bank_accounts(bank_name, last_four), payment_allocations(count)')
    .eq('company_id', user.profile.company_id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Payment History</h1>
          <p className="text-muted-foreground">Payments submitted against this account.</p>
        </div>
        {hasFinancialPermission(user.profile.role, 'pay_invoices') && (
          <Button render={<Link href="/dealer/financial/payments/new" />} nativeButton={false}>
            Make a Payment
          </Button>
        )}
      </div>

      {!payments || payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt size={40} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Bank Account</th>
                <th className="px-4 py-3">Invoices</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/dealer/financial/payments/${p.id}`} className="font-semibold hover:underline">
                      {p.payment_reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatDate(p.submitted_at)}</td>
                  <td className="px-4 py-3">
                    {p.bank_accounts ? `${p.bank_accounts.bank_name} •••• ${p.bank_accounts.last_four}` : '—'}
                  </td>
                  <td className="px-4 py-3">{p.payment_allocations[0]?.count ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant={PAYMENT_STATUS_VARIANT[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
