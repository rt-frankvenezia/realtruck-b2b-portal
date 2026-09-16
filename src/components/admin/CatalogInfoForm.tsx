'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Tables } from '@/lib/database.types'

type Catalog = Tables<'catalogs'>

export function CatalogInfoForm({ catalog }: { catalog: Catalog }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(catalog.name)
  const [description, setDescription] = useState(catalog.description ?? '')

  const hasChanges = name !== catalog.name || description !== (catalog.description ?? '')

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('catalogs')
        .update({ name: name.trim(), description: description.trim() || null })
        .eq('id', catalog.id)
      if (error) { toast.error(error.message); return }
      toast.success('Catalog updated')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${catalog.name}"? This will also delete its pricing and availability configuration and remove it from any Dealer Programs.`)) return
    startTransition(async () => {
      const supabase = createClient()

      // Delete underlying pricing_group and restriction_group (cascade clears rules/tiers)
      const pricingGroupId = catalog.pricing_group_id
      const restrictionGroupId = catalog.restriction_group_id

      const { error } = await supabase.from('catalogs').delete().eq('id', catalog.id)
      if (error) { toast.error(error.message); return }

      if (pricingGroupId) {
        await supabase.from('pricing_groups').delete().eq('id', pricingGroupId)
      }
      if (restrictionGroupId) {
        await supabase.from('restriction_groups').delete().eq('id', restrictionGroupId)
      }

      toast.success('Catalog deleted')
      router.push('/admin/catalogs')
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
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
          DELETE CATALOG
        </Button>
        <Button
          variant="outline"
          onClick={() => { setName(catalog.name); setDescription(catalog.description ?? '') }}
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
