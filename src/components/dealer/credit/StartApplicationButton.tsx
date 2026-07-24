'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function StartApplicationButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('start_credit_application', { p_company_id: companyId })
      if (error) {
        toast.error(error.message)
        return
      }
      router.push('/dealer/credit/apply')
    })
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      Start Application
    </Button>
  )
}
