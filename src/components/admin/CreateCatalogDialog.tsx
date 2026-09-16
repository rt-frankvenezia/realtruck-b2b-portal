'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateCatalogDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [baseDiscount, setBaseDiscount] = useState('15')
  const [defaultAccess, setDefaultAccess] = useState<'allowed' | 'not_allowed'>('allowed')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const supabase = createClient()

      // Create the underlying pricing_group for this catalog
      const { data: pg, error: pgErr } = await supabase
        .from('pricing_groups')
        .insert({
          name: `${name.trim()} — Pricing`,
          base_discount: Number(baseDiscount) || 0,
        })
        .select('id')
        .single()
      if (pgErr) { toast.error(pgErr.message); return }

      // Create the underlying restriction_group for this catalog
      const { data: rg, error: rgErr } = await supabase
        .from('restriction_groups')
        .insert({
          name: `${name.trim()} — Availability`,
          default_access: defaultAccess,
        })
        .select('id')
        .single()
      if (rgErr) { toast.error(rgErr.message); return }

      // Create the catalog record linking both
      const { data: catalog, error: catErr } = await supabase
        .from('catalogs')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          pricing_group_id: pg.id,
          restriction_group_id: rg.id,
        })
        .select('id')
        .single()
      if (catErr) { toast.error(catErr.message); return }

      toast.success(`${name.trim()} created`)
      setOpen(false)
      setName('')
      setDescription('')
      setBaseDiscount('15')
      setDefaultAccess('allowed')
      router.push(`/admin/catalogs/${catalog.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus size={16} className="mr-1" />New Catalog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New catalog</DialogTitle>
          <DialogDescription>
            A Catalog defines what dealers in an assigned program can purchase and what they pay. Configure pricing rules and availability rules after creating it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Catalog Name *</Label>
            <Input id="cat-name" placeholder="e.g. Standard Dealer Catalog" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea id="cat-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-base">Pricing — Base Discount %</Label>
              <Input
                id="cat-base"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={baseDiscount}
                onChange={(e) => setBaseDiscount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Availability — Default Access</Label>
              <Select value={defaultAccess} onValueChange={(v) => setDefaultAccess(v as 'allowed' | 'not_allowed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">Allowed (deny-list)</SelectItem>
                  <SelectItem value="not_allowed">Not Allowed (allow-list)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isPending || !name.trim()}>Create Catalog</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
