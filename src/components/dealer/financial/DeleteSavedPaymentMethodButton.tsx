'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function DeleteSavedPaymentMethodButton({
  methodId,
  label,
}: {
  methodId: string
  label: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(`Remove "${label}"? This can't be undone.`)) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('saved_payment_methods').delete().eq('id', methodId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Payment method removed')
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="icon-sm" disabled={isPending} onClick={handleDelete} title="Remove">
      <Trash2 size={14} className="text-destructive" />
    </Button>
  )
}
