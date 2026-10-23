'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

export function SendQuotePanel({
  quoteId,
  status,
}: {
  quoteId: string
  status: QuoteStatus
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const canSend = status === 'new' || status === 'working'
  const alreadySent = status === 'quote_sent'

  if (!canSend && !alreadySent) return null

  function handleSend() {
    startTransition(async () => {
      const supabase = createClient()

      if (message.trim()) {
        const { error: noteError } = await supabase.rpc('add_quote_note', {
          p_quote_id: quoteId,
          p_message: message.trim(),
          p_is_internal: false,
        })
        if (noteError) {
          toast.error(noteError.message)
          return
        }
      }

      const { error } = await supabase.rpc('send_quote', { p_quote_id: quoteId })
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Quote sent to customer')
      setMessage('')
      router.refresh()
    })
  }

  function handleResend() {
    startTransition(async () => {
      const supabase = createClient()

      if (message.trim()) {
        const { error: noteError } = await supabase.rpc('add_quote_note', {
          p_quote_id: quoteId,
          p_message: message.trim(),
          p_is_internal: false,
        })
        if (noteError) {
          toast.error(noteError.message)
          return
        }
      }

      const { error } = await supabase.rpc('send_quote', { p_quote_id: quoteId })
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Quote resent to customer')
      setMessage('')
      router.refresh()
    })
  }

  return (
    <div className={PANEL}>
      <div className={PANEL_HEADER}>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white">Message to Customer</h2>
          {alreadySent && (
            <span className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              <CheckCircle2 size={11} />
              Sent
            </span>
          )}
        </div>
      </div>
      <div className={PANEL_BODY}>
        <div className="flex flex-col gap-3">
          <textarea
            rows={4}
            placeholder={
              alreadySent
                ? 'Add a follow-up message (optional)...'
                : 'Enter a message to include with the quote (optional)...'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isPending}
            className="w-full resize-none rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {alreadySent
                ? 'The customer has already received this quote. Resending will notify them again.'
                : 'Sending the quote will notify the customer and move the quote to Quote Sent status.'}
            </p>
            <Button
              onClick={alreadySent ? handleResend : handleSend}
              disabled={isPending}
              className="shrink-0 bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
            >
              <Send size={14} className="mr-1.5" />
              {alreadySent ? 'Resend Quote' : 'Send Quote to Customer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
