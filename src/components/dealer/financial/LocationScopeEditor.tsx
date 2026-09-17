'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type CompanyLocation = { id: string; name: string }

export function LocationScopeEditor({
  methodId,
  currentScope,
  currentLocationIds,
  companyLocations,
}: {
  methodId: string
  currentScope: 'all' | 'selected'
  currentLocationIds: string[]
  companyLocations: CompanyLocation[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [scope, setScope] = useState<'all' | 'selected'>(currentScope)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentLocationIds)

  function toggleLocation(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id])
  }

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('saved_payment_methods')
        .update({ location_scope: scope })
        .eq('id', methodId)

      if (updateError) {
        toast.error(updateError.message)
        return
      }

      // Replace all location entries
      await supabase.from('saved_payment_method_locations').delete().eq('payment_method_id', methodId)

      if (scope === 'selected' && selectedIds.length > 0) {
        const { error: locError } = await supabase
          .from('saved_payment_method_locations')
          .insert(selectedIds.map((lid) => ({ payment_method_id: methodId, location_id: lid })))
        if (locError) {
          toast.error(locError.message)
          return
        }
      }

      toast.success('Availability updated')
      setOpen(false)
      router.refresh()
    })
  }

  const locationNames = companyLocations
    .filter((l) => currentLocationIds.includes(l.id))
    .map((l) => l.name)

  const chipLabel =
    currentScope === 'all'
      ? 'All Locations'
      : locationNames.length === 0
      ? 'No Locations'
      : locationNames.length === 1
      ? locationNames[0]
      : `${locationNames.length} Locations`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button className="inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted" />}>
        <MapPin size={10} />
        {chipLabel}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Availability</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} />
              All Locations
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" checked={scope === 'selected'} onChange={() => setScope('selected')} />
              Specific Locations
            </label>
          </div>
          {scope === 'selected' && (
            <div className="ml-5 flex flex-col gap-1">
              {companyLocations.map((loc) => (
                <label key={loc.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(loc.id)}
                    onChange={() => toggleLocation(loc.id)}
                  />
                  {loc.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function LocationScopeBadge({
  scope,
  locationIds,
  companyLocations,
}: {
  scope: 'all' | 'selected'
  locationIds: string[]
  companyLocations: CompanyLocation[]
}) {
  if (scope === 'all') {
    return <Badge variant="secondary" className="whitespace-nowrap"><MapPin size={10} className="mr-1" />All Locations</Badge>
  }
  const names = companyLocations.filter((l) => locationIds.includes(l.id)).map((l) => l.name)
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      <MapPin size={10} className="mr-1" />
      {names.length === 0 ? 'No Locations' : names.length === 1 ? names[0] : `${names.length} Locations`}
    </Badge>
  )
}
