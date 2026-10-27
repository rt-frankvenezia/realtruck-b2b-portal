'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { actionTransitionQuoteStatus } from '@/lib/actions/quotes'
import { QUOTE_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']

const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  new: ['working', 'closed_lost'],
  working: ['closed_lost'],
  quote_sent: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
  spam: [],
  invalid: [],
  test: [],
}

export function QuoteStatusSelect({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const [isPending, startTransition] = useTransition()
  const transitions = ALLOWED_TRANSITIONS[status]

  if (transitions.length === 0) {
    return <p className="mt-0.5 text-sm font-medium">{QUOTE_STATUS_LABEL[status]}</p>
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as QuoteStatus
    if (next === status) return
    startTransition(async () => {
      try {
        await actionTransitionQuoteStatus(quoteId, next)
        toast.success(`Status updated to ${QUOTE_STATUS_LABEL[next]}`)
      } catch {
        toast.error('Failed to update status')
      }
    })
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className="mt-0.5 h-8 w-full rounded border border-input bg-background px-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
    >
      <option value={status}>{QUOTE_STATUS_LABEL[status]}</option>
      {transitions.map((s) => (
        <option key={s} value={s}>
          {QUOTE_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  )
}
