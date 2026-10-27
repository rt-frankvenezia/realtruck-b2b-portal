'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { actionTransitionQuoteStatus } from '@/lib/actions/quotes'
import { Button } from '@/components/ui/button'
import { QUOTE_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']

// quote_sent is excluded here — sending is handled by SendQuotePanel.
const NEXT_STATUSES: Record<QuoteStatus, QuoteStatus[]> = {
  new: ['working', 'closed_lost'],
  working: ['closed_lost'],
  quote_sent: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
  spam: [],
  invalid: [],
  test: [],
}

export function QuoteStatusActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const [isPending, startTransition] = useTransition()

  function handleTransition(next: QuoteStatus) {
    startTransition(async () => {
      try {
        await actionTransitionQuoteStatus(quoteId, next)
        toast.success(`Status updated to ${QUOTE_STATUS_LABEL[next]}`)
      } catch {
        toast.error('Failed to update status')
      }
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
