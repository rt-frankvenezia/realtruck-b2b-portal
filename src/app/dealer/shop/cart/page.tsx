'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ShoppingCart, Trash2 } from 'lucide-react'
import { useDealerCart } from '@/components/dealer/DealerCartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/status-labels'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, subtotal } = useDealerCart()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Shopping Cart</h1>
        <p className="text-muted-foreground">
          {items.length} item{items.length === 1 ? '' : 's'} in cart
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <ShoppingCart size={56} className="text-muted-foreground/40" />
          <p className="text-lg text-muted-foreground">Your cart is empty</p>
          <Button render={<Link href="/dealer/shop" />} nativeButton={false}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="divide-y rounded-lg border">
              {items.map((item) => (
                <div key={item.productId} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                    <p className="text-xs font-mono text-muted-foreground">SKU: {item.sku}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          aria-label={`Quantity for ${item.name}`}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end sm:gap-3">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{formatCurrency(item.unitPrice)} each</div>
                      <div className="text-lg font-bold">{formatCurrency(item.unitPrice * item.quantity)}</div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.productId)} title="Remove from cart">
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-lg border">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold">Order Summary</h2>
              </div>
              <div className="flex flex-col gap-3 px-6 py-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Shipping and tax calculated at checkout.</p>
                <div className="border-t pt-4">
                  <Button className="w-full" onClick={() => router.push('/dealer/shop/checkout')}>
                    Proceed to Checkout
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
