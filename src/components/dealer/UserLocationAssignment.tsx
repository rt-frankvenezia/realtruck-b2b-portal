'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export function UserLocationAssignment({
  userId,
  assignedLocationIds,
  availableLocations,
}: {
  userId: string
  assignedLocationIds: string[]
  availableLocations: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(assignedLocationIds)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const toAdd = selected.filter((id) => !assignedLocationIds.includes(id))
      const toRemove = assignedLocationIds.filter((id) => !selected.includes(id))

      if (toAdd.length > 0) {
        const { error } = await supabase.from('user_locations').insert(toAdd.map((locationId) => ({ user_id: userId, location_id: locationId })))
        if (error) {
          toast.error(error.message)
          return
        }
      }
      if (toRemove.length > 0) {
        const { error } = await supabase.from('user_locations').delete().eq('user_id', userId).in('location_id', toRemove)
        if (error) {
          toast.error(error.message)
          return
        }
      }
      toast.success('Location assignments updated')
      router.refresh()
    })
  }

  if (availableLocations.length === 0) {
    return <p className="text-sm text-muted-foreground">No locations available to assign.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {availableLocations.map((loc) => (
          <label key={loc.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(loc.id)}
              onCheckedChange={(checked) =>
                setSelected((prev) => (checked ? [...prev, loc.id] : prev.filter((id) => id !== loc.id)))
              }
            />
            {loc.name}
          </label>
        ))}
      </div>
      <div>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          Save Assignments
        </Button>
      </div>
    </div>
  )
}
