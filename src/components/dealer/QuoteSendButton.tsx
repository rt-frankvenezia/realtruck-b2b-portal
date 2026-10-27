'use client'

import { useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { actionSendQuote } from '@/lib/actions/quotes'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']

export function QuoteSendButton({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const [expanded, setExpanded] = useState(false)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const canSend = status === 'new' || status === 'working'
  const alreadySent = status === 'quote_sent'
  if (!canSend && !alreadySent) return null

  const label = alreadySent ? 'Resend' : 'SEND QUOTE'
  const isPrimary = !alreadySent

  function handleSend() {
    startTransition(async () => {
      try {
        await actionSendQuote(quoteId, message.trim() || undefined)
        toast.success(alreadySent ? 'Quote resent to customer' : 'Quote sent to customer')
        setMessage('')
        setExpanded(false)
      } catch {
        toast.error('Failed to send quote')
      }
    })
  }

  if (expanded) {
    return (
      <div className="flex items-center gap-2">
        <textarea
          rows={1}
          placeholder="Optional message to customer..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-8 w-56 resize-none rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={isPending}
          variant={isPrimary ? 'default' : 'outline'}
          className={isPrimary ? 'bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90' : ''}
        >
          <Send size={13} className="mr-1" />
          {label}
        </Button>
        <button
          onClick={() => { setExpanded(false); setMessage('') }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      onClick={() => setExpanded(true)}
      variant={isPrimary ? 'default' : 'outline'}
      className={isPrimary ? 'bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90' : ''}
    >
      <Send size={13} className="mr-1" />
      {label}
    </Button>
  )
}
