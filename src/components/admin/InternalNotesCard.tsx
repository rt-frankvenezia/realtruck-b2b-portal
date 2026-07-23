'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 'locations' doesn't have an internal_notes column yet — add it there
// (and add 'locations' back to this union) when Location Detail gets its
// own Internal Notes card.
export function InternalNotesCard({ table, id, notes }: { table: 'companies'; id: string; notes: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(notes ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from(table).update({ internal_notes: value || null }).eq('id', id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Internal notes updated')
      setEditing(false)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">Only visible to RealTruck Admin. Not visible to dealer users.</p>
        {editing ? (
          <>
            <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm">{notes || 'No internal notes'}</p>
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit Notes
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
