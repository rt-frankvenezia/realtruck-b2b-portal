'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { FIXTURE_MAP } from '@/lib/mock/client'
import { DEMO_USERS } from '@/lib/mock/session'

function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

async function currentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('demo_user')?.value ?? DEMO_USERS[0].id
  return DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0]
}

export async function actionTransitionQuoteStatus(quoteId: string, newStatus: string) {
  const now = new Date().toISOString()
  const user = await currentUser()
  const arr = FIXTURE_MAP['quotes']
  if (arr) {
    const idx = arr.findIndex((q) => q.id === quoteId)
    if (idx !== -1) arr[idx] = { ...arr[idx], status: newStatus, updated_at: now }
  }
  const actArr = FIXTURE_MAP['quote_activity']
  if (actArr) {
    actArr.unshift({
      id: randomId(),
      quote_id: quoteId,
      type: 'status_change',
      message: `Status changed to ${newStatus.replace(/_/g, ' ')}`,
      is_internal: true,
      actor_id: user.id,
      created_at: now,
      users: { name: user.name },
    })
  }
  revalidatePath(`/dealer/quotes/${quoteId}`)
  revalidatePath('/dealer/quotes')
}

export async function actionSendQuote(quoteId: string, message?: string) {
  const now = new Date().toISOString()
  const user = await currentUser()
  const actArr = FIXTURE_MAP['quote_activity']

  if (message?.trim() && actArr) {
    actArr.unshift({
      id: randomId(),
      quote_id: quoteId,
      type: 'note',
      message: message.trim(),
      is_internal: false,
      actor_id: user.id,
      created_at: now,
      users: { name: user.name },
    })
  }

  const arr = FIXTURE_MAP['quotes']
  if (arr) {
    const idx = arr.findIndex((q) => q.id === quoteId)
    if (idx !== -1) arr[idx] = { ...arr[idx], status: 'quote_sent', updated_at: now }
  }

  if (actArr) {
    actArr.unshift({
      id: randomId(),
      quote_id: quoteId,
      type: 'status_change',
      message: 'Quote sent to customer',
      is_internal: false,
      actor_id: user.id,
      created_at: now,
      users: { name: user.name },
    })
  }

  revalidatePath(`/dealer/quotes/${quoteId}`)
  revalidatePath('/dealer/quotes')
}

export async function actionUpdateQuoteConfiguration(
  quoteId: string,
  snapshot: { kit: string; selections: Record<string, string> },
  lineItems: Array<{
    description: string
    sku: string | null
    price: number
    msrp: number
    quantity: number
    is_required: boolean
    type: string
  }>,
) {
  const now = new Date().toISOString()

  const qArr = FIXTURE_MAP['quotes']
  if (qArr) {
    const idx = qArr.findIndex((q) => q.id === quoteId)
    if (idx !== -1) qArr[idx] = { ...qArr[idx], configuration_snapshot: snapshot, updated_at: now }
  }

  const liArr = FIXTURE_MAP['quote_line_items']
  if (liArr) {
    const kept = liArr.filter((li) => li.quote_id !== quoteId)
    const newItems = lineItems.map((li) => ({
      id: randomId(),
      quote_id: quoteId,
      created_at: now,
      ...li,
    }))
    liArr.splice(0, liArr.length, ...kept, ...newItems)
  }

  revalidatePath(`/dealer/quotes/${quoteId}`)
}

export async function actionSaveExternalOrder(quoteId: string, orderNumber: string) {
  const now = new Date().toISOString()
  const arr = FIXTURE_MAP['quotes']
  if (arr) {
    const idx = arr.findIndex((q) => q.id === quoteId)
    if (idx !== -1) {
      arr[idx] = { ...arr[idx], external_order_number: orderNumber, ordered_externally_at: now, updated_at: now }
    }
  }
  revalidatePath(`/dealer/quotes/${quoteId}`)
}

export async function actionAddQuoteLineItem(quoteId: string, description: string, price: number) {
  const now = new Date().toISOString()
  const liArr = FIXTURE_MAP['quote_line_items']
  if (liArr) {
    liArr.push({
      id: randomId(),
      quote_id: quoteId,
      description,
      price,
      msrp: price,
      quantity: 1,
      is_required: false,
      type: 'base',
      created_at: now,
    })
  }
  revalidatePath(`/dealer/quotes/${quoteId}`)
}

export async function actionAddQuoteOption(quoteId: string, description: string, price: number) {
  const now = new Date().toISOString()
  const liArr = FIXTURE_MAP['quote_line_items']
  if (liArr) {
    liArr.push({
      id: randomId(),
      quote_id: quoteId,
      description,
      price,
      msrp: price,
      quantity: 1,
      is_required: false,
      type: 'option',
      created_at: now,
    })
  }
  revalidatePath(`/dealer/quotes/${quoteId}`)
}

export async function actionRemoveQuoteLineItem(itemId: string, quoteId: string) {
  const liArr = FIXTURE_MAP['quote_line_items']
  if (liArr) {
    const idx = liArr.findIndex((li: any) => li.id === itemId)
    if (idx !== -1) liArr.splice(idx, 1)
  }
  revalidatePath(`/dealer/quotes/${quoteId}`)
}

export async function actionAddQuoteDiscount(quoteId: string, description: string, amount: number) {
  const now = new Date().toISOString()
  const liArr = FIXTURE_MAP['quote_line_items']
  if (liArr) {
    liArr.push({
      id: randomId(),
      quote_id: quoteId,
      description,
      price: -Math.abs(amount),
      msrp: 0,
      quantity: 1,
      is_required: false,
      type: 'discount',
      created_at: now,
    })
  }
  revalidatePath(`/dealer/quotes/${quoteId}`)
}

export async function actionPlaceFiberglassOrder(quoteId: string): Promise<{ orderNumber: string }> {
  const now = new Date().toISOString()
  const user = await currentUser()
  const orderNumber = `RT-${new Date().getFullYear()}-${8000 + Math.floor(Math.random() * 999)}`

  const quotesArr = FIXTURE_MAP['quotes']
  const quote = quotesArr?.find((q) => q.id === quoteId)
  if (!quote) throw new Error('Quote not found')

  const lineItemsArr = FIXTURE_MAP['quote_line_items']
  const ordersArr = FIXTURE_MAP['product_orders']
  const orderItemsArr = FIXTURE_MAP['product_order_items']
  const orderId = randomId()

  const quoteLineItems = (lineItemsArr ?? []).filter((li) => li.quote_id === quoteId)
  const subtotal = quoteLineItems.reduce((sum, li) => sum + li.price * (li.quantity ?? 1), 0)
  const tax = Math.round(subtotal * (quote.tax_rate ?? 0.029) * 100) / 100
  const vehicle = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ')

  if (ordersArr) {
    ordersArr.unshift({
      id: orderId,
      order_number: orderNumber,
      company_id: quote.company_id,
      location_id: quote.location_id,
      status: 'processing',
      po_number: null,
      payment_method: 'Net 30 Terms',
      tracking_number: null,
      order_date: now.split('T')[0],
      estimated_delivery_date: null,
      ordered_by_name: user.name,
      ordered_by_email: user.email ?? '',
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      customer_phone: quote.customer_phone,
      customer_vehicle: vehicle,
      shipping_address: null, shipping_city: null, shipping_state: null,
      shipping_postal_code: null, shipping_country: 'US',
      subtotal, tax, total: subtotal + tax,
      terms_credit_account_id: null,
      created_at: now,
    })
  }

  if (orderItemsArr) {
    for (const li of quoteLineItems) {
      orderItemsArr.push({
        id: randomId(),
        product_order_id: orderId,
        product_name: li.description,
        sku: li.sku ?? '',
        quantity: li.quantity ?? 1,
        price: li.price,
        total: li.price * (li.quantity ?? 1),
      })
    }
  }

  if (quotesArr) {
    const idx = quotesArr.findIndex((q) => q.id === quoteId)
    if (idx !== -1) quotesArr[idx] = { ...quotesArr[idx], status: 'closed_won', updated_at: now }
  }

  const actArr = FIXTURE_MAP['quote_activity']
  if (actArr) {
    actArr.unshift({
      id: randomId(),
      quote_id: quoteId,
      type: 'status_change',
      message: `Wholesale order placed: ${orderNumber}`,
      is_internal: false,
      actor_id: user.id,
      created_at: now,
      users: { name: user.name },
    })
  }

  revalidatePath(`/dealer/quotes/${quoteId}`)
  revalidatePath('/dealer/quotes')
  revalidatePath('/dealer/orders')
  return { orderNumber }
}
