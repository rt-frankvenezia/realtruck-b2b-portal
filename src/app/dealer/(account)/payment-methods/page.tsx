import { redirect } from 'next/navigation'
import { CreditCard, Landmark } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddSavedPaymentMethodDialog } from '@/components/dealer/financial/AddSavedPaymentMethodDialog'
import { DeleteSavedPaymentMethodButton } from '@/components/dealer/financial/DeleteSavedPaymentMethodButton'
import { formatDate } from '@/lib/status-labels'

export default async function PaymentMethodsPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (user.profile.role === 'customer' || user.profile.role === 'realtruck_admin') {
    redirect('/dealer')
  }

  const role = user.profile.role
  const isStaff = role === 'staff'
  const companyId = user.profile.company_id
  const supabase = await createClient()

  const { data: methods } = await supabase
    .from('saved_payment_methods')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at')

  const cards = (methods ?? []).filter((m) => m.type === 'card')
  const bankAccounts = (methods ?? []).filter((m) => m.type === 'bank_account')

  function methodDisplayLabel(m: NonNullable<typeof methods>[number]) {
    if (m.label) return m.label
    const info = m.display_info as Record<string, string>
    if (m.type === 'card') return `${info.brand} •••• ${info.last4}`
    return `${info.bank} •••• ${info.last4}`
  }

  function methodSubLabel(m: NonNullable<typeof methods>[number]) {
    const info = m.display_info as Record<string, string>
    if (m.type === 'card') return `${info.brand} •••• ${info.last4} — Exp ${info.exp}`
    return `${info.bank} (${info.account_type}) •••• ${info.last4}`
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Payment Methods</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage saved cards and bank accounts for your dealer account.
          </p>
        </div>
        {!isStaff && (
          <AddSavedPaymentMethodDialog
            companyId={companyId}
            userId={user.profile.id}
          />
        )}
      </div>

      {/* Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Cards</h2>
        {cards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <CreditCard size={40} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No saved cards yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border">
            <div className="flex flex-col divide-y">
              {cards.map((m) => {
                const info = m.display_info as Record<string, string>
                return (
                  <div key={m.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-4">
                      <CreditCard size={20} className="shrink-0 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">{methodDisplayLabel(m)}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.label ? methodSubLabel(m) + ' • ' : ''}{info.brand} • Added {formatDate(m.created_at)}
                        </div>
                      </div>
                    </div>
                    {!isStaff && (
                      <div className="shrink-0">
                        <DeleteSavedPaymentMethodButton methodId={m.id} label={methodDisplayLabel(m)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Bank Accounts */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Bank Accounts</h2>
        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Landmark size={40} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No saved bank accounts yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border">
            <div className="flex flex-col divide-y">
              {bankAccounts.map((m) => {
                const info = m.display_info as Record<string, string | boolean>
                const verified = Boolean(info.verified)
                return (
                  <div key={m.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Landmark size={20} className="shrink-0 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2 font-semibold">
                          {methodDisplayLabel(m)}
                          <Badge variant={verified ? 'success' : 'secondary'}>
                            {verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.label ? `${info.bank as string} (${info.account_type as string}) •••• ${info.last4 as string} • ` : ''}
                          Added {formatDate(m.created_at)}
                        </div>
                      </div>
                    </div>
                    {!isStaff && (
                      <div className="shrink-0">
                        <DeleteSavedPaymentMethodButton methodId={m.id} label={methodDisplayLabel(m)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
