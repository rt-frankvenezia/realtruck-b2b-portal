'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PurchaseAccess } from '@/lib/restrictions'

export function CreateRestrictionGroupDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultAccess, setDefaultAccess] = useState<PurchaseAccess>('allowed')

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('restriction_groups')
        .insert({ name: name.trim(), description: description.trim() || null, default_access: defaultAccess })
        .select('id')
        .single()
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Restriction group created')
      setOpen(false)
      setName('')
      setDescription('')
      setDefaultAccess('allowed')
      router.push(`/admin/catalog-restrictions/${data.id}`)
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-1" />
        NEW GROUP
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Restriction Group</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Standard Dealer Catalog"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default Purchase Access</Label>
              <Select value={defaultAccess} onValueChange={(v) => setDefaultAccess(v as PurchaseAccess)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">Allowed — deny-list approach</SelectItem>
                  <SelectItem value="not_allowed">Not Allowed — allow-list approach</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {defaultAccess === 'allowed'
                  ? 'Dealers can buy everything unless a rule says Not Allowed.'
                  : 'Dealers cannot buy anything unless a rule says Allowed.'}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
