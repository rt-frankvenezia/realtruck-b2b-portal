import { redirect } from 'next/navigation'
import { CreditCard, Landmark } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddBankAccountDialog } from '@/components/dealer/financial/AddBankAccountDialog'
import { SetDefaultBankAccountButton } from '@/components/dealer/financial/SetDefaultBankAccountButton'
import { DeactivateBankAccountButton } from '@/components/dealer/financial/DeactivateBankAccountButton'
import { AddPaymentCardDialog } from '@/components/dealer/financial/AddPaymentCardDialog'
import { SetDefaultPaymentCardButton } from '@/components/dealer/financial/SetDefaultPaymentCardButton'
import { DeactivatePaymentCardButton } from '@/components/dealer/financial/DeactivatePaymentCardButton'
import { BANK_VERIFICATION_STATUS_LABEL, BANK_VERIFICATION_STATUS_VARIANT, formatDate } from '@/lib/status-labels'

export default async function PaymentMethodsPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'manage_bank_accounts')) redirect('/dealer')

  const companyId = user.profile.company_id
  const supabase = await createClient()

  // Terms accounts pay by Net terms only — checkout never shows Card/ACH
  // for them, so a saved card would never be selectable. Bank accounts
  // stay relevant regardless (used for paying invoices by ACH), so only
  // the Cards section is gated on this.
  const { data: creditAccount } = await supabase
    .from('credit_accounts')
    .select('id')
    .eq('company_id', companyId)
    .in('status', ['active', 'on_hold'])
    .maybeSingle()
  const hasCreditTerms = Boolean(creditAccount)

  const [{ data: bankAccounts }, { data: cards }] = await Promise.all([
    supabase.from('bank_accounts').select('*, users(name)').eq('company_id', companyId).order('created_at'),
    hasCreditTerms
      ? Promise.resolve({ data: null })
      : supabase.from('payment_cards').select('*, users(name)').eq('company_id', companyId).order('created_at'),
  ])

  const activeBankAccounts = (bankAccounts ?? []).filter((a) => a.verification_status !== 'deactivated')
  const deactivatedBankAccounts = (bankAccounts ?? []).filter((a) => a.verification_status === 'deactivated')
  const activeCards = (cards ?? []).filter((c) => c.status !== 'deactivated')
  const deactivatedCards = (cards ?? []).filter((c) => c.status === 'deactivated')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Payment Methods</h1>
        <p className="text-muted-foreground">Manage the cards and bank accounts used to pay for orders.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">Bank Accounts</h2>
          <AddBankAccountDialog companyId={companyId} isFirstAccount={activeBankAccounts.length === 0} />
        </div>

        {activeBankAccounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Landmark size={40} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No bank accounts yet. Add one to pay by ACH.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border">
            <div className="flex flex-col divide-y">
              {activeBankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Landmark size={20} className="text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        {account.bank_name} •••• {account.last_four}
                        {account.is_default && <Badge variant="outline">Default</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {account.account_type === 'checking' ? 'Checking' : 'Savings'} • Added {formatDate(account.created_at)}
                        {account.users?.name ? ` by ${account.users.name}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={BANK_VERIFICATION_STATUS_VARIANT[account.verification_status]}>
                      {BANK_VERIFICATION_STATUS_LABEL[account.verification_status]}
                    </Badge>
                    {!account.is_default && account.verification_status === 'verified' && (
                      <SetDefaultBankAccountButton bankAccountId={account.id} />
                    )}
                    <DeactivateBankAccountButton bankAccountId={account.id} accountLabel={`${account.bank_name} •••• ${account.last_four}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {deactivatedBankAccounts.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Deactivated</h3>
            <div className="rounded-lg border opacity-60">
              <div className="flex flex-col divide-y">
                {deactivatedBankAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Landmark size={20} className="text-muted-foreground" />
                      <div>
                        <div className="font-semibold">
                          {account.bank_name} •••• {account.last_four}
                        </div>
                        <div className="text-xs text-muted-foreground">Deactivated {formatDate(account.deactivated_at)}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">Deactivated</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!hasCreditTerms && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">Cards</h2>
            <AddPaymentCardDialog companyId={companyId} isFirstCard={activeCards.length === 0} />
          </div>

          {activeCards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <CreditCard size={40} className="text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No cards yet. Add one to pay by card at checkout.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <div className="flex flex-col divide-y">
                {activeCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                      <CreditCard size={20} className="text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2 font-semibold">
                          {card.card_brand} •••• {card.last_four}
                          {card.is_default && <Badge variant="outline">Default</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expires {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year} • Added {formatDate(card.created_at)}
                          {card.users?.name ? ` by ${card.users.name}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!card.is_default && <SetDefaultPaymentCardButton paymentCardId={card.id} />}
                      <DeactivatePaymentCardButton paymentCardId={card.id} cardLabel={`${card.card_brand} •••• ${card.last_four}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deactivatedCards.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Removed</h3>
              <div className="rounded-lg border opacity-60">
                <div className="flex flex-col divide-y">
                  {deactivatedCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-4">
                        <CreditCard size={20} className="text-muted-foreground" />
                        <div className="font-semibold">
                          {card.card_brand} •••• {card.last_four}
                        </div>
                      </div>
                      <Badge variant="secondary">Removed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
