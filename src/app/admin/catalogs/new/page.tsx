'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

export default function NewCatalogPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultAccess, setDefaultAccess] = useState<'allowed' | 'not_allowed'>('allowed')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const supabase = createClient()

      const { error: rgErr } = await supabase
        .from('restriction_groups')
        .insert({
          name: `${name.trim()} — Availability`,
          default_access: defaultAccess,
        })
      if (rgErr) { toast.error(rgErr.message); return }

      const { error: catErr } = await supabase
        .from('catalogs')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
        })
      if (catErr) { toast.error(catErr.message); return }

      toast.success(`${name.trim()} created`)
      router.push('/admin/catalogs')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/catalogs" className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to Catalogs
        </Link>
        <h1 className="text-2xl font-semibold">New Catalog</h1>
        <p className="mt-1 text-muted-foreground">A Catalog defines what a dealer is allowed to buy.</p>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Catalog Information</h2>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Catalog Name *</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Standard Dealer Catalog"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              rows={2}
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Availability</h2>
        </div>
        <div className="flex flex-col gap-1.5 p-4">
          <Label>Default Access</Label>
          <Select value={defaultAccess} onValueChange={(v) => setDefaultAccess(v as 'allowed' | 'not_allowed')}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allowed">Allowed (deny-list) — all products available unless explicitly excluded</SelectItem>
              <SelectItem value="not_allowed">Not Allowed (allow-list) — no products available unless explicitly included</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">You can add specific availability rules after creating the catalog.</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/catalogs')} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
          {isPending ? 'Creating…' : 'Create Catalog'}
        </Button>
      </div>
    </div>
  )
}
