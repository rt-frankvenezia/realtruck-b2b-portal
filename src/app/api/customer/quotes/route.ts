import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findCapModel, CAP_OPTIONS } from '@/lib/catalog'
import type { CartItem } from '@/components/customer/CartContext'

// Public lead capture: a shopper submitting the builder is usually not
// logged in at all, and quotes_write (Phase 2 RLS) is scoped to dealer
// staff — by design, a stranger shouldn't get a direct INSERT grant on a
// table dealers rely on for correctly-scoped lead data. Route it through
// the service role instead of widening RLS.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { customer, vehicle, locationId, items } = body ?? {}

  if (!customer?.name || !customer?.email || !locationId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'customer, locationId, and at least one item are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: location, error: locationError } = await admin
    .from('locations')
    .select('id, company_id, status')
    .eq('id', locationId)
    .maybeSingle()

  if (locationError) return NextResponse.json({ error: locationError.message }, { status: 500 })
  if (!location || location.status !== 'active') {
    return NextResponse.json({ error: 'Selected location is not available' }, { status: 400 })
  }

  const { data: quote, error: quoteError } = await admin
    .from('quotes')
    .insert({
      status: 'new',
      source: '3d-configurator',
      location_id: location.id,
      company_id: location.company_id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone ?? null,
      customer_address: customer.address ?? null,
      vehicle_year: vehicle?.year ?? null,
      vehicle_make: vehicle?.make ?? null,
      vehicle_model: vehicle?.model ?? null,
      bed_length: vehicle?.bedLength ?? null,
    })
    .select('id')
    .single()

  if (quoteError) return NextResponse.json({ error: quoteError.message }, { status: 500 })

  const lineItems = (items as CartItem[]).flatMap((item) => {
    const model = findCapModel(item.capModelId)
    if (!model) return []
    const rows = [
      {
        quote_id: quote.id,
        description: `${model.name} (${item.color} / ${item.finish})`,
        msrp: model.msrp,
        price: model.msrp,
        quantity: 1,
        is_required: true,
        type: 'base' as const,
      },
      ...item.optionIds.map((optionId) => {
        const option = CAP_OPTIONS.find((o) => o.id === optionId)
        return {
          quote_id: quote.id,
          description: option?.name ?? optionId,
          msrp: option?.price ?? 0,
          price: option?.price ?? 0,
          quantity: 1,
          is_required: false,
          type: 'option' as const,
        }
      }),
    ]
    return rows
  })

  const { error: lineItemsError } = await admin.from('quote_line_items').insert(lineItems)
  if (lineItemsError) return NextResponse.json({ error: lineItemsError.message }, { status: 500 })

  return NextResponse.json({ ok: true, quoteId: quote.id })
}
