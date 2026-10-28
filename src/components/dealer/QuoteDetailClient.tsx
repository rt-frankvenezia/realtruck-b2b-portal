'use client'

import { useState } from 'react'
import { QuoteActionBar } from '@/components/dealer/QuoteActionBar'
import { OrderPartsDrawer } from '@/components/dealer/OrderPartsDrawer'

type LineItem = {
  id: string
  description: string
  sku: string | null
  price: number
  msrp: number
  quantity: number
  type?: string | null
}

export function QuoteDetailClient({
  quoteId,
  status,
  partsStatus,
  orderNumber,
  partsArrangedReason,
  partsArrangedNote,
  displayNum,
  customerName,
  lineItems,
  topBarLeft,
  topBarRight,
  children,
}: {
  quoteId: string
  status: string
  partsStatus: string
  orderNumber: string | null
  partsArrangedReason: string | null
  partsArrangedNote: string | null
  displayNum: string
  customerName: string | null
  lineItems: LineItem[]
  topBarLeft: React.ReactNode
  topBarRight: React.ReactNode
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        {topBarLeft}
        <div className="flex items-center gap-2">
          {topBarRight}
          <QuoteActionBar
            quoteId={quoteId}
            status={status}
            partsStatus={partsStatus}
            orderNumber={orderNumber}
            displayNum={displayNum}
            customerName={customerName}
            onOrderParts={() => setDrawerOpen(true)}
          />
        </div>
      </div>

      {children}

      <OrderPartsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        quoteId={quoteId}
        displayNum={displayNum}
        customerName={customerName}
        lineItems={lineItems}
        partsStatus={partsStatus}
        partsArrangedReason={partsArrangedReason}
        partsArrangedNote={partsArrangedNote}
        orderNumber={orderNumber}
      />
    </div>
  )
}
