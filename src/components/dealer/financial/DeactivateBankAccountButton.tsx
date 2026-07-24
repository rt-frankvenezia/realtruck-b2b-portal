'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Docs 02 §16: prevent deactivation when the account is tied to an
// actively processing payment — checked here rather than in a DB
// constraint, since it's a soft business rule, not data integrity.
export function DeactivateBankAccountButton({ bankAccountId, accountLabel }: { bankAccountId: string; accountLabel: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDeactivate() {
    startTransition(async () => {
      const supabase = createClient()

      const { count } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('bank_account_id', bankAccountId)
        .in('status', ['submitted', 'processing'])

      if (count && count > 0) {
        toast.error('This account has a payment currently processing and cannot be deactivated yet.')
        setOpen(false)
        return
      }

      const { error } = await supabase
        .from('bank_accounts')
        .update({ verification_status: 'deactivated', deactivated_at: new Date().toISOString(), is_default: false })
        .eq('id', bankAccountId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Bank account deactivated')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Deactivate</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate {accountLabel}?</DialogTitle>
          <DialogDescription>This account will no longer be available to select for new payments.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeactivate} disabled={isPending}>
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
