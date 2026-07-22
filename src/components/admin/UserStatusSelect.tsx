'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { USER_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type UserStatus = Database['public']['Enums']['user_status']
const ALL_STATUSES: UserStatus[] = ['invited', 'active', 'disabled']

export function UserStatusSelect({ userId, status }: { userId: string; status: UserStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: UserStatus) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('users').update({ status: next }).eq('id', userId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Status updated to ${USER_STATUS_LABEL[next]}`)
      router.refresh()
    })
  }

  return (
    <Select value={status} onValueChange={(v) => handleChange(v as UserStatus)} disabled={isPending}>
      <SelectTrigger className="w-40">
        <SelectValue>{USER_STATUS_LABEL[status]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {USER_STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
