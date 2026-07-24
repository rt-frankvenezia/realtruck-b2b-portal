import { redirect } from 'next/navigation'
import { Landmark } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddBankAccountDialog } from '@/components/dealer/financial/AddBankAccountDialog'
import { SetDefaultBankAccountButton } from '@/components/dealer/financial/SetDefaultBankAccountButton'
import { DeactivateBankAccountButton } from '@/components/dealer/financial/DeactivateBankAccountButton'
import { BANK_VERIFICATION_STATUS_LABEL, BANK_VERIFICATION_STATUS_VARIANT, formatDate } from '@/lib/status-labels'

export default async function BankAccountsPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'manage_bank_accounts')) redirect('/dealer')

  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('*, users(name)')
    .eq('company_id', user.profile.company_id)
    .order('created_at')

  const active = (accounts ?? []).filter((a) => a.verification_status !== 'deactivated')
  const deactivated = (accounts ?? []).filter((a) => a.verification_status === 'deactivated')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage the accounts used to pay invoices by ACH.</p>
        </div>
        <AddBankAccountDialog companyId={user.profile.company_id} isFirstAccount={active.length === 0} />
      </div>

      {active.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Landmark size={40} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No bank accounts yet. Add one to pay invoices by ACH.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <div className="flex flex-col divide-y">
            {active.map((account) => (
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

      {deactivated.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Deactivated</h2>
          <div className="rounded-lg border opacity-60">
            <div className="flex flex-col divide-y">
              {deactivated.map((account) => (
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
  )
}
