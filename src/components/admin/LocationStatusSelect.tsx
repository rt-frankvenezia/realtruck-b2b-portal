'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LOCATION_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type LocationStatus = Database['public']['Enums']['location_status']
const ALL_STATUSES: LocationStatus[] = ['pending_approval', 'active', 'suspended', 'closed']

export function LocationStatusSelect({ locationId, status }: { locationId: string; status: LocationStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: LocationStatus) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('locations').update({ status: next }).eq('id', locationId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Status updated to ${LOCATION_STATUS_LABEL[next]}`)
      router.refresh()
    })
  }

  return (
    <Select value={status} onValueChange={(v) => handleChange(v as LocationStatus)} disabled={isPending}>
      <SelectTrigger className="w-44">
        <SelectValue>{LOCATION_STATUS_LABEL[status]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LOCATION_STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
