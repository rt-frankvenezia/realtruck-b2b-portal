import { DealerCartProvider } from '@/components/dealer/DealerCartContext'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <DealerCartProvider>{children}</DealerCartProvider>
}
