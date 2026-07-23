'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { Tables } from '@/lib/database.types'

const TYPE_LABEL: Record<Tables<'quote_activity'>['type'], string> = {
  status_change: 'Status Change',
  note: 'Note',
  quote_sent: 'Quote Sent',
  system: 'System',
}

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea placeholder="Add a note…" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="flex items-center justify-between">
          {canAddInternal ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={isInternal} onCheckedChange={(c) => setIsInternal(c === true)} />
              Internal note (RealTruck staff only)
            </label>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={handleAddNote} disabled={isPending || !message.trim()}>
            Add Note
          </Button>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-md border p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABEL[entry.type]}
                </Badge>
                {entry.is_internal && (
                  <Badge variant="secondary" className="text-xs">
                    Internal
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
            <p>{entry.message}</p>
            {entry.users?.name && <p className="mt-1 text-xs text-muted-foreground">— {entry.users.name}</p>}
          </li>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
      </ol>
    </div>
  )
}
