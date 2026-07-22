'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QUOTE_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']

const DEALER_SETTABLE_STATUSES: QuoteStatus[] = ['new', 'working', 'quote_sent', 'converted', 'lost', 'spam']

export function QuoteStatusSelect({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: QuoteStatus) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('quotes').update({ status: next }).eq('id', quoteId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Status updated to ${QUOTE_STATUS_LABEL[next]}`)
      router.refresh()
    })
  }

  return (
    <Select value={status} onValueChange={(v) => handleChange(v as QuoteStatus)} disabled={isPending}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DEALER_SETTABLE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {QUOTE_STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
