'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SetDefaultPaymentCardButton({ paymentCardId }: { paymentCardId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('set_default_payment_card', { p_payment_card_id: paymentCardId })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Default card updated')
      router.refresh()
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      Make Default
    </Button>
  )
}
