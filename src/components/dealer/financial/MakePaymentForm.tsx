'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Landmark, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency, formatDate } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type Invoice = Database['public']['Tables']['invoices']['Row']
type BankAccount = Database['public']['Tables']['bank_accounts']['Row']

export function MakePaymentForm({
  companyId,
  invoices,
  bankAccounts,
  preselectedInvoiceId,
}: {
  companyId: string
  invoices: Invoice[]
  bankAccounts: BankAccount[]
  preselectedInvoiceId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(preselectedInvoiceId ? [preselectedInvoiceId] : [])
  )
  const [bankAccountId, setBankAccountId] = useState(bankAccounts.find((b) => b.is_default)?.id ?? bankAccounts[0]?.id ?? '')
  const [achAuthorized, setAchAuthorized] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const selectedInvoices = invoices.filter((inv) => selectedIds.has(inv.id))
  const total = selectedInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0)

  function toggleInvoice(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('create_payment', {
        p_company_id: companyId,
        p_bank_account_id: bankAccountId,
        p_invoice_ids: Array.from(selectedIds),
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Payment submitted')
      router.push(`/dealer/financial/payments/${data.id}`)
    })
  }

  const canSubmit = selectedIds.size > 0 && !!bankAccountId && achAuthorized && confirmed && !isPending

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Make a Payment</h1>
        <p className="text-muted-foreground">Select invoices to pay in full. Partial payments are not supported.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className="rounded-lg border">
            <div className="border-b px-6 py-4 font-semibold">Select Invoices</div>
            <div className="flex flex-col divide-y">
              {invoices.map((inv) => (
                <label key={inv.id} className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedIds.has(inv.id)} onCheckedChange={() => toggleInvoice(inv.id)} />
                    <div>
                      <div className="font-semibold">{inv.invoice_number}</div>
                      <div className="text-xs text-muted-foreground">Due {formatDate(inv.due_date)}</div>
                    </div>
                  </div>
                  <div className="font-semibold">{formatCurrency(inv.remaining_balance)}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="border-b px-6 py-4 font-semibold">Bank Account</div>
            <div className="flex flex-col gap-3 p-6">
              {bankAccounts.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    You don&apos;t have a verified bank account yet.{' '}
                    <Link href="/dealer/financial/bank-accounts" className="font-semibold underline">
                      Add one
                    </Link>{' '}
                    to make a payment.
                  </AlertDescription>
                </Alert>
              ) : (
                bankAccounts.map((account) => (
                  <label key={account.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50">
                    <input
                      type="radio"
                      name="bank-account"
                      checked={bankAccountId === account.id}
                      onChange={() => setBankAccountId(account.id)}
                    />
                    <Landmark size={18} className="text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        {account.bank_name} •••• {account.last_four}
                      </div>
                      <div className="text-xs text-muted-foreground">{account.account_type === 'checking' ? 'Checking' : 'Savings'}</div>
                    </div>
                    {account.is_default && <span className="text-xs text-muted-foreground">Default</span>}
                  </label>
                ))
              )}
            </div>
          </div>

          {selectedIds.size > 0 && bankAccountId && (
            <div className="rounded-lg border">
              <div className="border-b px-6 py-4 font-semibold">Review &amp; Authorize</div>
              <div className="flex flex-col gap-4 p-6">
                <div className="rounded-md border bg-blue-50 p-3 text-xs text-blue-900">
                  By providing your bank account information and authorizing this payment, you authorize RealTruck to
                  electronically debit your account for the total amount below.
                </div>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={achAuthorized} onCheckedChange={(v) => setAchAuthorized(v === true)} className="mt-0.5" />
                  I authorize this ACH debit for {formatCurrency(total)}.
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
                  I confirm the invoice selections and amount above are correct.
                </label>
              </div>
            </div>
          )}

          <Button size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
            <Lock size={16} />
            Submit Payment
          </Button>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-lg border">
            <div className="border-b px-6 py-4 font-semibold">Payment Summary</div>
            <div className="flex flex-col gap-3 px-6 py-4">
              {selectedInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Select one or more invoices to pay.</p>
              ) : (
                selectedInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <span>{inv.invoice_number}</span>
                    <span className="font-semibold">{formatCurrency(inv.remaining_balance)}</span>
                  </div>
                ))
              )}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Payment</span>
                  <span className="text-xl font-bold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
