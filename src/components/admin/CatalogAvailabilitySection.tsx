'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tables } from '@/lib/database.types'
import type { PurchaseAccess } from '@/lib/restrictions'

export function CatalogAvailabilitySection({
  restrictionGroup,
}: {
  restrictionGroup: Tables<'restriction_groups'>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [defaultAccess, setDefaultAccess] = useState<PurchaseAccess>(restrictionGroup.default_access)

  const hasChanges = defaultAccess !== restrictionGroup.default_access

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('restriction_groups')
        .update({ default_access: defaultAccess, updated_at: new Date().toISOString() })
        .eq('id', restrictionGroup.id)
      if (error) { toast.error(error.message); return }
      toast.success('Default availability saved')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Availability controls whether dealers can <em>purchase</em> a product — not whether they can see it. Products remain visible regardless of availability status. Add rules below to override the default for specific categories, brands, or product lines.
      </p>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Default Purchase Access</Label>
          <Select value={defaultAccess} onValueChange={(v) => setDefaultAccess(v as PurchaseAccess)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allowed">Allowed (deny-list)</SelectItem>
              <SelectItem value="not_allowed">Not Allowed (allow-list)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={isPending || !hasChanges} size="sm">
          SAVE
        </Button>
        {hasChanges && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDefaultAccess(restrictionGroup.default_access)}
            disabled={isPending}
          >
            CANCEL
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {defaultAccess === 'allowed'
          ? 'Deny-list mode — dealers can purchase everything unless a rule below says Not Allowed.'
          : 'Allow-list mode — dealers cannot purchase anything unless a rule below says Allowed.'}
      </p>
    </div>
  )
}
