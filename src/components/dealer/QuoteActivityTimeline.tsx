'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { Tables } from '@/lib/database.types'

export function QuoteActivityTimeline({
  quoteId,
  entries,
  canAddInternal,
}: {
  quoteId: string
  entries: (Tables<'quote_activity'> & { users: { name: string } | null })[]
  canAddInternal: boolean
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleAddNote() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('add_quote_note', {
        p_quote_id: quoteId,
        p_message: message,
        p_is_internal: isInternal,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setMessage('')
      setIsInternal(false)
      toast.success('Note added')
      router.refresh()
    })
  }

  return (
    <>
      {/* Activity section header */}
      <div className="-mx-0 mb-0 flex items-center bg-[#1E1E1E] px-4 py-3">
        <h2 className="font-semibold text-white">Activity</h2>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
        {/* Note input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Note <span className="text-muted-foreground">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Enter a note here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center justify-between">
            {canAddInternal ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={isInternal} onCheckedChange={(c) => setIsInternal(c === true)} />
                Internal (RealTruck staff only)
              </label>
            ) : (
              <span />
            )}
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={isPending || !message.trim()}
              className="bg-[#FFC60B] text-[#1E1E1E] hover:bg-[#FFC60B]/90"
            >
              ADD NOTE
            </Button>
          </div>
        </div>

        {/* Timeline entries */}
        <ol className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id} className="text-sm">
              <p className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {entry.users?.name ? ` · ${entry.users.name}` : ''}
                {entry.is_internal && ' · Internal'}
              </p>
              <p className="mt-0.5">{entry.message}</p>
            </li>
          ))}
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </ol>
      </div>
    </>
  )
}
