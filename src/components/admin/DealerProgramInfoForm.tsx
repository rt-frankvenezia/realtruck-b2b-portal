'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Tables } from '@/lib/database.types'

const NONE = '__none__'

type DealerProgram = Tables<'dealer_programs'>

export function DealerProgramInfoForm({
  program,
  catalogs,
}: {
  program: DealerProgram
  catalogs: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(program.name)
  const [description, setDescription] = useState(program.description ?? '')
  const [catalogId, setCatalogId] = useState(program.catalog_id ?? NONE)

  const hasChanges =
    name !== program.name ||
    description !== (program.description ?? '') ||
    catalogId !== (program.catalog_id ?? NONE)

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('dealer_programs')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          catalog_id: catalogId === NONE ? null : catalogId,
        })
        .eq('id', program.id)
      if (error) { toast.error(error.message); return }
      toast.success('Dealer program updated')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${program.name}"? Dealers in this program will have their program assignment cleared.`)) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('dealer_programs').delete().eq('id', program.id)
      if (error) { toast.error(error.message); return }
      toast.success('Dealer program deleted')
      router.push('/admin/dealer-programs')
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Catalog</Label>
          <Select value={catalogId} onValueChange={(v) => setCatalogId(v ?? NONE)}>
            <SelectTrigger>
              <SelectValue>{catalogs.find((c) => c.id === catalogId)?.name ?? 'None assigned'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {catalogs.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Description</Label>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isPending}
        >
          DELETE PROGRAM
        </Button>
        <Button
          variant="outline"
          onClick={() => { setName(program.name); setDescription(program.description ?? ''); setCatalogId(program.catalog_id ?? NONE) }}
          disabled={isPending || !hasChanges}
        >
          CANCEL
        </Button>
        <Button onClick={handleSave} disabled={isPending || !hasChanges || !name.trim()}>
          SAVE CHANGES
        </Button>
      </div>
    </div>
  )
}
