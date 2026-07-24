'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Docs 02 §16: "Use a mocked secure flow... never request or persist real
// bank-account data." No real account/routing number is ever collected —
// last four digits only, and verification lands instantly (the docs'
// "Instant verification" fixture option; pending/failed are demonstrated
// via seeded accounts rather than a dealer-facing simulate toggle, which
// would be a new demo mechanism this app has never otherwise used).
export function AddBankAccountDialog({ companyId, isFirstAccount }: { companyId: string; isFirstAccount: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [bankName, setBankName] = useState('')
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking')
  const [lastFour, setLastFour] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setOpen(false)
    setBankName('')
    setAccountType('checking')
    setLastFour('')
  }

  function handleSubmit() {
    startTransition(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from('bank_accounts').insert({
        company_id: companyId,
        bank_name: bankName,
        account_type: accountType,
        last_four: lastFour,
        verification_status: 'verified',
        is_default: isFirstAccount,
        created_by_user_id: user?.id,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Bank account added and verified')
      reset()
      router.refresh()
    })
  }

  const isValid = bankName.trim().length > 0 && /^\d{4}$/.test(lastFour)

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : reset())}>
      <DialogTrigger render={<Button />}>
        <Plus size={16} />
        Add Bank Account
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
          <DialogDescription>Connect a bank account to pay invoices by ACH.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              This is a mocked secure connection for the prototype — no real account or routing number is collected
              or stored.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bank-name">Bank Name</Label>
            <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Chase Business Complete Banking" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-type">Account Type</Label>
            <select
              id="account-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as 'checking' | 'savings')}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="last-four">Last 4 Digits of Account Number</Label>
            <Input
              id="last-four"
              maxLength={4}
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            Connect Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
