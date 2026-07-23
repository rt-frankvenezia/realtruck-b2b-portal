'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Requirement = { label: string; met: boolean }

export function DealerActivationPanel({ companyId, requirements }: { companyId: string; requirements: Requirement[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const allMet = requirements.every((r) => r.met)

  function handleActivate() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('companies').update({ status: 'active' }).eq('id', companyId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Company activated')
      router.refresh()
    })
  }

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Dealer Activation Required</h3>
        <Button size="sm" onClick={handleActivate} disabled={!allMet || isPending}>
          Activate Company
        </Button>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {requirements.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            {r.met ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-destructive" />}
            <span className={r.met ? '' : 'text-destructive'}>{r.label}</span>
          </li>
        ))}
      </ul>
      {!allMet && <p className="mt-3 text-sm font-medium text-destructive">Complete all requirements above to activate this dealer.</p>}
    </div>
  )
}
