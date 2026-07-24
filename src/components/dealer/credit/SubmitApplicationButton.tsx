'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SubmitApplicationButton({ applicationId, disabled }: { applicationId: string; disabled?: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('submit_credit_application', { p_application_id: applicationId })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Application submitted')
      router.push('/dealer/credit')
    })
  }

  return (
    <Button onClick={handleSubmit} disabled={disabled || isPending}>
      Submit Application
    </Button>
  )
}
