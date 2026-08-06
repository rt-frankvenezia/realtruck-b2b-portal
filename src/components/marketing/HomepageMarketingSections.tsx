import Link from 'next/link'
import { Package, ShieldCheck, Truck, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const WHY_CHOOSE_US = [
  {
    icon: Wallet,
    title: 'Dealer Pricing',
    description: 'Order the full RealTruck catalog at your negotiated dealer price, every time.',
  },
  {
    icon: Truck,
    title: 'Fast Fulfillment',
    description: 'Real-time order tracking from placement through delivery to your location.',
  },
  {
    icon: ShieldCheck,
    title: 'Warranty Support',
    description: 'Every order is backed by manufacturer warranty coverage and dealer support.',
  },
  {
    icon: Package,
    title: 'Flexible Payment Terms',
    description: 'Apply for Net terms and manage invoices, statements, and payments in one place.',
  },
] as const

export function WhyChooseUsSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-8 py-14">
      <h2 className="mb-8 text-center text-2xl font-bold text-[#1c1c1e]">Why Choose RealTruck</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_CHOOSE_US.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon size={22} className="text-[#1c1c1e]" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export const STATIC_CATEGORIES = [
  'Truck Bed Covers',
  'Floor Liners',
  'Lift Kits',
  'Bumpers',
  'Towing',
  'Exterior Accessories',
  'Interior Accessories',
] as const

type LiveCategory = { id: string; name: string; slug: string; catalog_products: { count: number }[] }

// Two modes: logged-out visitors get static, non-linked tiles (there's
// nothing to link to without a session) that jump to the embedded login
// form; logged-in dealer-side roles get the real catalog with live counts
// linking straight into the shop.
export function CategoriesSection({ categories }: { categories?: LiveCategory[] }) {
  return (
    <section className="bg-neutral-50 py-14">
      <div className="mx-auto max-w-[1440px] px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-[#1c1c1e]">Popular Categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories ? (
            categories.map((category) => {
              const count = category.catalog_products[0]?.count ?? 0
              return (
                <Link key={category.id} href={`/dealer/shop/${category.slug}`} className="group">
                  <Card className="h-full transition-shadow group-hover:shadow-md">
                    <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-white">
                        <Package size={24} className="text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {count} product{count === 1 ? '' : 's'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          ) : (
            STATIC_CATEGORIES.map((name) => (
              <a key={name} href="#login" className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-white">
                      <Package size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">{name}</h3>
                  </CardContent>
                </Card>
              </a>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  {
    question: 'How do I become a RealTruck dealer?',
    answer:
      'Reach out to your RealTruck sales representative or call 877-123-4567 to start the dealer onboarding process.',
  },
  {
    question: 'How does dealer pricing work?',
    answer:
      'Every dealer is assigned a pricing group with brand, category, and product-line-specific discounts off MAP pricing, applied automatically at checkout.',
  },
  {
    question: 'Can I pay for orders on credit terms?',
    answer:
      'Yes — apply for Net payment terms from your dealer account. Once approved, eligible orders are invoiced instead of charged immediately.',
  },
  {
    question: 'How do I track an order?',
    answer:
      'Order History in your dealer account shows real-time status from processing through delivery to your location.',
  },
] as const

export function FaqSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-8 py-14">
      <h2 className="mb-8 text-center text-2xl font-bold text-[#1c1c1e]">RealTruck Dealer FAQs</h2>
      <div className="mx-auto flex max-w-3xl flex-col divide-y rounded-lg border">
        {FAQS.map(({ question, answer }) => (
          <details key={question} className="group px-6 py-4">
            <summary className="cursor-pointer list-none font-semibold text-[#1c1c1e] marker:content-none">
              {question}
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
