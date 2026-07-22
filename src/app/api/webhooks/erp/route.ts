import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Phase 3 external integration seam (roadmap Section 6): a stand-in for
// RealTruck's real manufacturing/ERP system. It only knows shipping
// milestones, not dealer scheduling — the transition_installation_status
// engine (source: 'erp') is what decides whether a given milestone is
// still a valid move given the installation's current state.
//
// Payload: { orderNumber: string, event: 'in_production' | 'preparing_to_ship' | 'shipped' | 'delivered_to_dealer' }
//
// 'in_production' / 'preparing_to_ship' are acknowledged but don't move
// dealer_status — this schema only tracks shipping milestones
// (cap_in_transit / cap_delivered), not manufacturing sub-phases. See the
// comment on get_customer_facing_status for why that's a documented
// simplification rather than an oversight.

const EVENT_TO_STATUS: Record<string, 'cap_in_transit' | 'cap_delivered' | null> = {
  in_production: null,
  preparing_to_ship: null,
  shipped: 'cap_in_transit',
  delivered_to_dealer: 'cap_delivered',
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const orderNumber = body?.orderNumber
  const event = body?.event

  if (typeof orderNumber !== 'string' || typeof event !== 'string') {
    return NextResponse.json({ error: 'orderNumber and event are required' }, { status: 400 })
  }
  if (!(event in EVENT_TO_STATUS)) {
    return NextResponse.json({ error: `unknown event: ${event}` }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: installation, error: lookupError } = await admin
    .from('installations')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!installation) return NextResponse.json({ error: `no installation with order_number ${orderNumber}` }, { status: 404 })

  const targetStatus = EVENT_TO_STATUS[event]
  if (targetStatus === null) {
    return NextResponse.json({ ok: true, noop: true, reason: `${event} has no corresponding dealer_status milestone yet` })
  }

  const { data: result, error: transitionError } = await admin.rpc('transition_installation_status', {
    p_installation_id: installation.id,
    p_new_status: targetStatus,
    p_source: 'erp',
    p_note: `ERP event: ${event}`,
  })

  if (transitionError) {
    // Most likely an out-of-order/duplicate ERP event (e.g. "shipped"
    // arriving after the installation already moved past it) — the engine
    // rejects it, and that's a 409, not a 500.
    return NextResponse.json({ error: transitionError.message }, { status: 409 })
  }

  return NextResponse.json({ ok: true, installation: result })
}
