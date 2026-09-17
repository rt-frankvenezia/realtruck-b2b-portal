import { redirect } from 'next/navigation'
import { CreditCard, Landmark } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddSavedPaymentMethodDialog } from '@/components/dealer/financial/AddSavedPaymentMethodDialog'
import { DeleteSavedPaymentMethodButton } from '@/components/dealer/financial/DeleteSavedPaymentMethodButton'
import { LocationScopeEditor, LocationScopeBadge } from '@/components/dealer/financial/LocationScopeEditor'
import { formatDate } from '@/lib/status-labels'

export default async function PaymentMethodsPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  // Staff cannot manage payment methods; realtruck_admin has no company context here.
  if (user.profile.role === 'staff' || user.profile.role === 'customer' || user.profile.role === 'realtruck_admin') {
    redirect('/dealer')
  }

  const role = user.profile.role
  const isDealerAdmin = role === 'dealer_admin'
  const companyId = user.profile.company_id
  const supabase = await createClient()

  // All company methods with location assignments
  const { data: rawMethods } = await supabase
    .from('saved_payment_methods')
    .select('*, saved_payment_method_locations(location_id)')
    .eq('company_id', companyId)
    .order('created_at')

  // For location_admin: find their assigned locations to filter/pre-scope
  let userLocationIds: string[] = []
  if (!isDealerAdmin) {
    const { data: ul } = await supabase
      .from('user_locations')
      .select('location_id')
      .eq('user_id', user.profile.id)
    userLocationIds = (ul ?? []).map((r) => r.location_id)
  }

  const allMethods = (rawMethods ?? []).map((m) => ({
    ...m,
    locationIds: m.saved_payment_method_locations.map((l) => l.location_id),
  }))

  // location_admin sees only methods available to their locations
  const visibleMethods = isDealerAdmin
    ? allMethods
    : allMethods.filter(
        (m) =>
          m.location_scope === 'all' ||
          m.locationIds.some((lid) => userLocationIds.includes(lid))
      )

  const cards = visibleMethods.filter((m) => m.type === 'card')
  const bankAccounts = visibleMethods.filter((m) => m.type === 'bank_account')

  // Company locations for scope editor and add dialog (dealer_admin needs all; location_admin needs their subset)
  const { data: allCompanyLocations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('company_id', companyId)
    .in('status', ['active', 'pending_approval'])
    .order('name')

  const companyLocations = isDealerAdmin
    ? (allCompanyLocations ?? [])
    : (allCompanyLocations ?? []).filter((l) => userLocationIds.includes(l.id))

  function methodDisplayLabel(m: (typeof visibleMethods)[number]) {
    if (m.label) return m.label
    const info = m.display_info as Record<string, string>
    if (m.type === 'card') return `${info.brand} •••• ${info.last4}`
    return `${info.bank} •••• ${info.last4}`
  }

  function methodSubLabel(m: (typeof visibleMethods)[number]) {
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
            {isDealerAdmin
              ? 'Manage saved cards and bank accounts. Control which locations can use each method at checkout.'
              : 'Saved payment methods available at your location(s).'}
          </p>
        </div>
        <AddSavedPaymentMethodDialog
          companyId={companyId}
          userId={user.profile.id}
          isDealerAdmin={isDealerAdmin}
          companyLocations={companyLocations}
          userLocationIds={userLocationIds}
        />
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
                    <div className="flex shrink-0 items-center gap-3">
                      {isDealerAdmin ? (
                        <LocationScopeEditor
                          methodId={m.id}
                          currentScope={m.location_scope}
                          currentLocationIds={m.locationIds}
                          companyLocations={companyLocations}
                        />
                      ) : (
                        <LocationScopeBadge
                          scope={m.location_scope}
                          locationIds={m.locationIds}
                          companyLocations={companyLocations}
                        />
                      )}
                      <DeleteSavedPaymentMethodButton methodId={m.id} label={methodDisplayLabel(m)} />
                    </div>
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
                    <div className="flex shrink-0 items-center gap-3">
                      {isDealerAdmin ? (
                        <LocationScopeEditor
                          methodId={m.id}
                          currentScope={m.location_scope}
                          currentLocationIds={m.locationIds}
                          companyLocations={companyLocations}
                        />
                      ) : (
                        <LocationScopeBadge
                          scope={m.location_scope}
                          locationIds={m.locationIds}
                          companyLocations={companyLocations}
                        />
                      )}
                      <DeleteSavedPaymentMethodButton methodId={m.id} label={methodDisplayLabel(m)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {!isDealerAdmin && (
        <p className="text-xs text-muted-foreground">
          Contact your Dealer Admin to add new payment methods or change location availability.
        </p>
      )}
    </div>
  )
}
