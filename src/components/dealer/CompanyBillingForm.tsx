'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Tables } from '@/lib/database.types'

export function CompanyBillingForm({ company }: { company: Tables<'companies'> }) {
  const router = useRouter()
  const [address, setAddress] = useState(company.billing_address ?? '')
  const [city, setCity] = useState(company.billing_city ?? '')
  const [state, setState] = useState(company.billing_state ?? '')
  const [postalCode, setPostalCode] = useState(company.billing_postal_code ?? '')
  const [country, setCountry] = useState(company.billing_country ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({
          billing_address: address,
          billing_city: city,
          billing_state: state,
          billing_postal_code: postalCode,
          billing_country: country,
        })
        .eq('id', company.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Billing address updated')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="billing-address">Address</Label>
        <Input id="billing-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="billing-city">City</Label>
          <Input id="billing-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="billing-state">State</Label>
          <Input id="billing-state" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="billing-postal">Postal Code</Label>
          <Input id="billing-postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="billing-country">Country</Label>
          <Input id="billing-country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>
      <div>
        <Button onClick={handleSave} disabled={isPending} size="sm">
          Save Billing Address
        </Button>
      </div>
    </div>
  )
}
