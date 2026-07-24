'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SetDefaultBankAccountButton({ bankAccountId }: { bankAccountId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('set_default_bank_account', { p_bank_account_id: bankAccountId })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Default bank account updated')
      router.refresh()
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      Make Default
    </Button>
  )
}
