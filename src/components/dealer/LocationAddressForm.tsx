'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Tables } from '@/lib/database.types'

export function LocationAddressForm({ location }: { location: Tables<'locations'> }) {
  const router = useRouter()
  const [address, setAddress] = useState(location.address ?? '')
  const [city, setCity] = useState(location.city ?? '')
  const [state, setState] = useState(location.state ?? '')
  const [postalCode, setPostalCode] = useState(location.postal_code ?? '')
  const [phoneNumber, setPhoneNumber] = useState(location.phone_number ?? '')
  const [contactEmail, setContactEmail] = useState(location.primary_contact_email ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('locations')
        .update({
          address,
          city,
          state,
          postal_code: postalCode,
          phone_number: phoneNumber,
          primary_contact_email: contactEmail,
        })
        .eq('id', location.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Location updated — note the name may have regenerated from the new city/state')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="loc-address">Address</Label>
        <Input id="loc-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="loc-city">City</Label>
          <Input id="loc-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="loc-state">State</Label>
          <Input id="loc-state" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="loc-postal">Postal Code</Label>
          <Input id="loc-postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="loc-phone">Phone</Label>
          <Input id="loc-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="loc-email">Primary Contact Email</Label>
          <Input id="loc-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
      </div>
      <div>
        <Button onClick={handleSave} disabled={isPending} size="sm">
          Save
        </Button>
      </div>
    </div>
  )
}
