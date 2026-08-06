import Link from 'next/link'
import Image from 'next/image'
import { Bell, ChevronDown, MessageCircle, Phone, ShoppingCart, MapPin, User } from 'lucide-react'
import { CartBadge } from '@/components/customer/CartBadge'
import { DealerCartBadge } from '@/components/dealer/DealerCartBadge'
import { AccountMenu } from '@/components/marketing/AccountMenu'
import { ShopCategoriesMenu } from '@/components/marketing/ShopCategoriesMenu'

// The "My Account" shell (account/dealer/admin) and the public storefront
// (build/cart/checkout) use the same chrome above a differently-themed white
// nav row — `context` picks which nav row renders, `variant` picks the
// role-specific bits (utility bar content, home link, account menu target).
export function SiteHeader({
  variant = 'customer',
  context = 'account',
  userEmail,
  userName,
  companyName,
  locationLabel,
  shopCategories,
  showDealerCart,
}: {
  variant?: 'customer' | 'dealer' | 'admin'
  context?: 'storefront' | 'account'
  userEmail?: string
  userName?: string
  companyName?: string
  locationLabel?: string
  shopCategories?: { name: string; slug: string }[]
  showDealerCart?: boolean
}) {
  const isCustomer = variant === 'customer'
  const homeHref = isCustomer ? (userEmail ? '/account' : '/build') : variant === 'admin' ? '/admin' : '/dealer'
  // The logo always goes to the homepage for dealer/admin — homeHref itself
  // stays pointed at the role's own dashboard since it's also used by
  // AccountMenu's "My Account" item, which should keep going there.
  const logoHref = isCustomer ? homeHref : '/'
  const accountLabel = userName ?? userEmail

  return (
    <>
      <div className="h-8 bg-[#FFC60B]" />

      <div className="flex h-[37px] items-center bg-[#1c1c1e]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-end gap-6 px-8 text-sm text-white">
          <span className="hidden sm:inline">Help</span>
          {context === 'account' && <span className="hidden sm:inline">Order Status</span>}
          {isCustomer ? (
            <span className="flex items-center gap-2 text-[#FFC60B]">
              <MapPin size={14} />
              Boca Raton, FL
            </span>
          ) : companyName ? (
            <span className="flex items-center gap-1.5">
              {companyName}
              {locationLabel ? ` | ${locationLabel}` : ''}
              <ChevronDown size={14} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-20 bg-[#2a2a2a]">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-8 px-8">
          <Link href={logoHref} className="flex items-center gap-3">
            <Image src="/realtruck-logo.png" alt="RealTruck" width={140} height={24} className="h-10 w-auto" priority />
            {!isCustomer && (
              <>
                <div className="h-8 w-px bg-neutral-600" />
                <div className="text-sm uppercase tracking-wider text-neutral-400">
                  {variant === 'admin' ? 'Admin' : 'Dealers'}
                </div>
              </>
            )}
          </Link>

          <div className="max-w-2xl flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search 1M+ Truck Accessories"
                className="h-11 w-full rounded bg-white px-4 pr-12 text-sm text-[#1c1c1e] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button type="button" aria-label="Notifications" className="text-white transition-colors hover:text-[#FFC60B]">
              <Bell size={22} className="text-[#FFC60B]" />
            </button>

            <button className="hidden items-center gap-3 text-white transition-colors hover:text-[#FFC60B] sm:flex">
              <MessageCircle size={22} className="text-[#FFC60B]" />
              <div className="text-left">
                <div className="text-sm font-semibold">Live Chat</div>
                <div className="text-xs opacity-90">Chat with an Expert</div>
              </div>
            </button>

            <button className="hidden items-center gap-3 text-white transition-colors hover:text-[#FFC60B] md:flex">
              <Phone size={22} className="text-[#FFC60B]" />
              <div className="text-left">
                <div className="text-sm font-semibold">877-123-4567</div>
                <div className="text-xs opacity-90">Sales and Service Hours</div>
              </div>
            </button>

            <AccountMenu homeHref={homeHref} accountLabel={accountLabel} loggedIn={Boolean(userEmail)}>
              <div className="flex items-center gap-2 text-white transition-colors hover:text-[#FFC60B]">
                <User size={22} className="text-[#FFC60B]" />
                <div className="text-left">
                  <div className="text-sm font-semibold">My Account</div>
                  <div className="text-xs opacity-90">{accountLabel ?? 'Log in'}</div>
                </div>
              </div>
            </AccountMenu>

            {/* Customer variant links the 3D-configurator cart (CartContext);
                dealer variant links the wholesale-ordering cart
                (DealerCartContext) — two separate product domains, same as
                everywhere else this session keeps them apart. realtruck_admin
                has no cart of their own (no company to order for), so it
                stays a plain decorative icon for them. */}
            {isCustomer ? (
              <Link href="/cart" className="relative text-white transition-colors hover:text-[#FFC60B]">
                <ShoppingCart size={22} className="text-[#FFC60B]" />
                <CartBadge />
              </Link>
            ) : showDealerCart ? (
              <Link href="/dealer/shop/cart" className="relative text-white transition-colors hover:text-[#FFC60B]">
                <ShoppingCart size={22} className="text-[#FFC60B]" />
                <DealerCartBadge />
              </Link>
            ) : (
              <span className="text-white/60">
                <ShoppingCart size={22} className="text-[#FFC60B]/60" />
              </span>
            )}
          </div>
        </div>
      </div>

      {context === 'storefront' ? (
        <div className="h-[53px] border-b border-[#f3f3f3] bg-white">
          <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-8">
            <nav className="flex h-full items-center gap-6 text-sm font-bold text-[#1c1c1e]">
              <Link href="/build" className="flex h-full items-center border-b-2 border-transparent transition-all hover:border-[#FFC60B]">
                3D Builder
              </Link>
              <span className="flex h-full items-center border-b-2 border-transparent text-[#1c1c1e]/60">Shop by Vehicle</span>
              <span className="flex h-full items-center border-b-2 border-transparent text-[#1c1c1e]/60">Accessories</span>
              <span className="flex h-full items-center border-b-2 border-transparent text-[#1c1c1e]/60">Categories</span>
              <span className="flex h-full items-center border-b-2 border-transparent text-[#1c1c1e]/60">Deals</span>
            </nav>
            <div className="rounded bg-[#FFC60B] px-6 py-2">
              <div className="text-sm font-bold text-[#1c1c1e]">Build a cap</div>
              <div className="text-xs text-[#1c1c1e]/80">for your truck</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[53px] border-b border-[#f3f3f3] bg-white">
          <div className="mx-auto flex h-full max-w-[1440px] items-center gap-6 px-8 text-sm font-bold text-[#1c1c1e]">
            {shopCategories ? (
              <ShopCategoriesMenu categories={shopCategories} />
            ) : (
              <span className="flex items-center gap-1">
                Categories
                <ChevronDown size={14} />
              </span>
            )}
            <span className="text-[#1c1c1e]/60">Brands</span>
            <span className="text-[#1c1c1e]/60">SKU Lookup</span>
            <span className="text-[#1c1c1e]/60">New Products</span>
            <span className="text-[#1c1c1e]/60">Promos</span>
            <span className="text-[#1c1c1e]/60">RealTruck Builder</span>
          </div>
        </div>
      )}
    </>
  )
}
