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

// No processing-payment guard like DeactivateBankAccountButton has — cards
// are never used for real invoice payments (payments.bank_account_id is
// the only payment rail), only for the checkout mock, so there's nothing
// in-flight a card deactivation could interrupt.
export function DeactivatePaymentCardButton({ paymentCardId, cardLabel }: { paymentCardId: string; cardLabel: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDeactivate() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('payment_cards')
        .update({ status: 'deactivated', deactivated_at: new Date().toISOString(), is_default: false })
        .eq('id', paymentCardId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Card removed')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Remove</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {cardLabel}?</DialogTitle>
          <DialogDescription>This card will no longer be available to select at checkout.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeactivate} disabled={isPending}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
