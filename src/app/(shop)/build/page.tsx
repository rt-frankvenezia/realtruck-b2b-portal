'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CAP_MODELS, CAP_OPTIONS } from '@/lib/catalog'
import { useCart } from '@/components/customer/CartContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/status-labels'
import { cn } from '@/lib/utils'

export default function BuildPage() {
  const router = useRouter()
  const { addItem } = useCart()
  const [modelId, setModelId] = useState(CAP_MODELS[0].id)
  const model = CAP_MODELS.find((m) => m.id === modelId)!
  const [color, setColor] = useState(model.colors[0])
  const [finish, setFinish] = useState(model.finishes[0])
  const [optionIds, setOptionIds] = useState<string[]>([])

  function selectModel(id: string) {
    const next = CAP_MODELS.find((m) => m.id === id)!
    setModelId(id)
    setColor(next.colors[0])
    setFinish(next.finishes[0])
  }

  function handleAddToCart() {
    addItem({ capModelId: modelId, color, finish, optionIds })
    toast.success(`${model.name} added to cart`)
    router.push('/cart')
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Build your cap</h1>
        <p className="text-muted-foreground">Pick a model, color, and options — a dealer near you handles installation.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CAP_MODELS.map((m) => (
          <Card
            key={m.id}
            className={cn('cursor-pointer transition-colors', m.id === modelId && 'border-primary ring-1 ring-primary')}
            onClick={() => selectModel(m.id)}
          >
            <CardHeader>
              <CardTitle>{m.name}</CardTitle>
              <CardDescription>{m.description}</CardDescription>
            </CardHeader>
            <CardContent className="font-medium">{formatCurrency(m.msrp)}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">Color</p>
            <div className="flex flex-wrap gap-2">
              {model.colors.map((c) => (
                <Button key={c} type="button" size="sm" variant={c === color ? 'default' : 'outline'} onClick={() => setColor(c)}>
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Finish</p>
            <div className="flex flex-wrap gap-2">
              {model.finishes.map((f) => (
                <Button key={f} type="button" size="sm" variant={f === finish ? 'default' : 'outline'} onClick={() => setFinish(f)}>
                  {f}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Options</p>
            <div className="flex flex-col gap-2">
              {CAP_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={optionIds.includes(option.id)}
                    onCheckedChange={(checked) =>
                      setOptionIds((prev) => (checked ? [...prev, option.id] : prev.filter((id) => id !== option.id)))
                    }
                  />
                  {option.name} — {formatCurrency(option.price)}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <p className="text-lg font-semibold">
            {formatCurrency(model.msrp + optionIds.reduce((sum, id) => sum + (CAP_OPTIONS.find((o) => o.id === id)?.price ?? 0), 0))}
          </p>
          <Button onClick={handleAddToCart}>Add to Cart</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
