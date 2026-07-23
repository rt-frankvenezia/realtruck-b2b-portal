import Link from 'next/link'
import { CartProvider } from '@/components/customer/CartContext'
import { CartLink } from '@/components/customer/CartLink'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b px-8 py-4">
          <Link href="/build" className="font-semibold">
            RealTruck
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/build" className="text-muted-foreground hover:text-foreground">
              Build
            </Link>
            <CartLink />
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </CartProvider>
  )
}
