'use client'

import Link from 'next/link'
import { useCart } from '@/components/customer/CartContext'
import { findCapModel, CAP_OPTIONS } from '@/lib/catalog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/status-labels'

export default function CartPage() {
  const { items, removeItem, itemTotal, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="text-muted-foreground">Build a cap to get started.</p>
        <Button render={<Link href="/build" />}>Start building</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Your cart</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const model = findCapModel(item.capModelId)
          return (
            <Card key={item.lineId}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{model?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.color} / {item.finish}
                  </p>
                  {item.optionIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {item.optionIds.map((id) => CAP_OPTIONS.find((o) => o.id === id)?.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-medium">{formatCurrency(itemTotal(item))}</p>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.lineId)}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-lg font-semibold">Subtotal: {formatCurrency(total)}</p>
        <Button render={<Link href="/checkout" />} size="lg">
          Checkout
        </Button>
      </div>
    </div>
  )
}
