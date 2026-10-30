'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { actionUpdateCompanyStatus } from '@/lib/actions/admin'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COMPANY_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type CompanyStatus = Database['public']['Enums']['company_status']
const ALL_STATUSES: CompanyStatus[] = ['pending_provisioning', 'active', 'suspended', 'closed']

export function CompanyStatusSelect({ companyId, status }: { companyId: string; status: CompanyStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: CompanyStatus) {
    startTransition(async () => {
      const { error } = await actionUpdateCompanyStatus(companyId, next)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Status updated to ${COMPANY_STATUS_LABEL[next]}`)
      router.refresh()
    })
  }

  return (
    <Select value={status} onValueChange={(v) => handleChange(v as CompanyStatus)} disabled={isPending}>
      <SelectTrigger className="w-56">
        <SelectValue>{COMPANY_STATUS_LABEL[status]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {COMPANY_STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
