'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { QUOTE_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']

// quote_sent is excluded here — sending is handled by SendQuotePanel below the line items.
const NEXT_STATUSES: Record<QuoteStatus, QuoteStatus[]> = {
  new: ['working', 'lost'],
  working: ['lost'],
  quote_sent: ['converted', 'lost'],
  converted: [],
  lost: [],
  spam: [],
  invalid: [],
  test: [],
}

export function QuoteStatusActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleTransition(next: QuoteStatus) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('transition_quote_status', { p_quote_id: quoteId, p_new_status: next })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Status updated to ${QUOTE_STATUS_LABEL[next]}`)
      router.refresh()
    })
  }

  const nextStatuses = NEXT_STATUSES[status]
  if (nextStatuses.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {nextStatuses.map((s) => (
        <Button key={s} size="sm" variant="outline" onClick={() => handleTransition(s)} disabled={isPending}>
          Mark {QUOTE_STATUS_LABEL[s]}
        </Button>
      ))}
    </div>
  )
}
