import { CartProvider } from '@/components/customer/CartContext'
import { SiteHeader } from '@/components/marketing/SiteHeader'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-8 py-8">{children}</main>
      </div>
    </CartProvider>
  )
}
