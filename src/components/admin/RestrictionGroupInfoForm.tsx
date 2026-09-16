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
import type { PurchaseAccess } from '@/lib/restrictions'

type RestrictionGroup = Tables<'restriction_groups'>

export function RestrictionGroupInfoForm({ group }: { group: RestrictionGroup }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [defaultAccess, setDefaultAccess] = useState<PurchaseAccess>(group.default_access)

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('restriction_groups')
        .update({
          name,
          description: description.trim() || null,
          default_access: defaultAccess,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Saved')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${group.name}"? This will remove all rules and unassign all dealers.`)) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('restriction_groups').delete().eq('id', group.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Restriction group deleted')
      router.push('/admin/catalog-restrictions')
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Default Purchase Access</Label>
          <Select value={defaultAccess} onValueChange={(v) => setDefaultAccess(v as PurchaseAccess)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allowed">Allowed</SelectItem>
              <SelectItem value="not_allowed">Not Allowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional description"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {defaultAccess === 'allowed'
          ? 'Deny-list: dealers can purchase everything unless a rule says Not Allowed.'
          : 'Allow-list: dealers cannot purchase anything unless a rule says Allowed.'}
      </p>
      <div className="flex items-center justify-between pt-2">
        <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
          Delete Group
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => { setName(group.name); setDescription(group.description ?? ''); setDefaultAccess(group.default_access) }}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={isPending || !name.trim()} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
