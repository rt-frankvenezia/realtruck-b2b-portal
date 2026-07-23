'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreatePricingGroupDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [baseDiscount, setBaseDiscount] = useState('0')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pricing_groups')
        .insert({ name, description: description || null, base_discount: Number(baseDiscount) || 0 })
        .select('id')
        .single()
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`${name} created`)
      setOpen(false)
      setName('')
      setDescription('')
      setBaseDiscount('0')
      router.push(`/admin/pricing-groups/${data.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New Pricing Group</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New pricing group</DialogTitle>
          <DialogDescription>Add rules and assign dealers after creating it.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="group-name">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="group-base-discount">Base Discount %</Label>
            <Input
              id="group-base-discount"
              type="number"
              step="0.01"
              value={baseDiscount}
              onChange={(e) => setBaseDiscount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
