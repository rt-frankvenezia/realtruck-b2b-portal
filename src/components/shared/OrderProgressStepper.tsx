import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type ProductOrderStatus = Database['public']['Enums']['product_order_status']

const STAGES: { key: ProductOrderStatus; label: string }[] = [
  { key: 'processing', label: 'Processing' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
]

export function OrderProgressStepper({ status }: { status: ProductOrderStatus }) {
  const currentIndex = STAGES.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center">
      {STAGES.map((stage, i) => {
        const done = status === 'delivered' || i < currentIndex
        const current = !done && i === currentIndex
        const dotColor = done ? 'bg-green-600' : current ? (status === 'processing' ? 'bg-[#FFC60B]' : 'bg-blue-500') : 'bg-neutral-300'
        return (
          <div key={stage.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotColor)} />
              <span className={cn('text-sm', done || current ? 'font-medium text-foreground' : 'text-muted-foreground')}>{stage.label}</span>
            </div>
            {i < STAGES.length - 1 && <div className={cn('mx-3 h-0.5 flex-1', done ? 'bg-green-600' : 'bg-neutral-200')} />}
          </div>
        )
      })}
    </div>
  )
}
