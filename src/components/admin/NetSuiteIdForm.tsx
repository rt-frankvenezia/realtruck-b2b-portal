'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { actionUpdateCompanyNetSuiteId } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NetSuiteIdForm({ companyId, netsuiteCustomerId }: { companyId: string; netsuiteCustomerId: string | null }) {
  const router = useRouter()
  const [value, setValue] = useState(netsuiteCustomerId ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const { error } = await actionUpdateCompanyNetSuiteId(companyId, value || null)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('NetSuite Customer ID updated')
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="NS-XXXX" className="max-w-40" />
      <Button size="sm" variant="outline" onClick={handleSave} disabled={isPending || value === (netsuiteCustomerId ?? '')}>
        Save
      </Button>
    </div>
  )
}
