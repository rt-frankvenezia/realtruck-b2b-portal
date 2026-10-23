import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { LeerConfigurator } from '@/components/dealer/LeerConfigurator'
import catalogData from '@/lib/leer/data/catalog.json'

// Static imports — Next.js can trace these; avoids fs.readFileSync path issues on Vercel
import kit_10113214 from '@/lib/leer/data/kits/10113214.json'
import bom_10113214 from '@/lib/leer/data/kits/10113214.bom.json'
import kit_3488646 from '@/lib/leer/data/kits/3488646.json'
import bom_3488646 from '@/lib/leer/data/kits/3488646.bom.json'
import kit_3187051 from '@/lib/leer/data/kits/3187051.json'
import bom_3187051 from '@/lib/leer/data/kits/3187051.bom.json'
import kit_3209539 from '@/lib/leer/data/kits/3209539.json'
import bom_3209539 from '@/lib/leer/data/kits/3209539.bom.json'
import kit_3187173 from '@/lib/leer/data/kits/3187173.json'
import bom_3187173 from '@/lib/leer/data/kits/3187173.bom.json'
import kit_3591889 from '@/lib/leer/data/kits/3591889.json'
import bom_3591889 from '@/lib/leer/data/kits/3591889.bom.json'
import kit_3546703 from '@/lib/leer/data/kits/3546703.json'
import bom_3546703 from '@/lib/leer/data/kits/3546703.bom.json'
import kit_3760056 from '@/lib/leer/data/kits/3760056.json'
import bom_3760056 from '@/lib/leer/data/kits/3760056.bom.json'
import kit_5716833 from '@/lib/leer/data/kits/5716833.json'
import bom_5716833 from '@/lib/leer/data/kits/5716833.bom.json'

const KIT_DATA: Record<string, any> = {
  '10113214': kit_10113214,
  '3488646':  kit_3488646,
  '3187051':  kit_3187051,
  '3209539':  kit_3209539,
  '3187173':  kit_3187173,
  '3591889':  kit_3591889,
  '3546703':  kit_3546703,
  '3760056':  kit_3760056,
  '5716833':  kit_5716833,
}

const BOM_DATA: Record<string, any> = {
  '10113214': bom_10113214,
  '3488646':  bom_3488646,
  '3187051':  bom_3187051,
  '3209539':  bom_3209539,
  '3187173':  bom_3187173,
  '3591889':  bom_3591889,
  '3546703':  bom_3546703,
  '3760056':  bom_3760056,
  '5716833':  bom_5716833,
}

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

type ProductId = '100s' | '100rcc' | 'acc-mt3'

const FAMILY_MAP: Record<ProductId, string> = {
  '100s':    '100S',
  '100rcc':  '100RCC',
  'acc-mt3': 'ACC-MT3',
}

const FAMILY_LABEL: Record<ProductId, string> = {
  '100s':    'LEER 100S — Fiberglass Sport Cap',
  '100rcc':  'LEER 100RCC — Fiberglass Rear Corner Cap',
  'acc-mt3': 'LEER ACC-MT3 — Aluminum Cap',
}

export default async function LeerCapsPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { productId: rawProductId } = await params
  const productId = rawProductId as ProductId

  if (!FAMILY_MAP[productId]) notFound()

  const sp = await searchParams
  const quoteId = sp.quoteId
  const returnUrl = sp.returnUrl ?? (quoteId ? `/dealer/quotes/${quoteId}` : '/dealer/quotes')
  const familyCode = FAMILY_MAP[productId]
  const familyLabel = FAMILY_LABEL[productId]

  const allCatalogKits = (catalogData as any).kits as Array<{
    id: string
    sku: string
    title: string
    family: string
    fitment: string
    historical: boolean
  }>

  const backLink = (
    <Link
      href={returnUrl}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft size={14} />
      Back to Quote
    </Link>
  )

  if (productId === 'acc-mt3') {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
              <h1 className="font-semibold text-white">{familyLabel}</h1>
              <span className="ml-1 rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Aluminum</span>
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-muted-foreground">
              Aluminum caps are configured manually. Use the line items editor on the quote to add
              the cap and any accessories, then price them according to your LEER dealer schedule.
            </p>
            <Link
              href={returnUrl}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ChevronLeft size={14} />
              Return to quote
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const familyKits = allCatalogKits.filter((k) => k.family === familyCode && !k.historical)
  if (familyKits.length === 0) notFound()

  const kitModels: Record<string, any> = {}
  const kitBoms: Record<string, any> = {}
  for (const kit of familyKits) {
    kitModels[kit.id] = KIT_DATA[kit.id]
    kitBoms[kit.id] = BOM_DATA[kit.id]
  }

  return (
    <div className="flex flex-col gap-6">
      {backLink}
      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
            <h1 className="font-semibold text-white">{familyLabel}</h1>
            <span className="ml-1 rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Fiberglass</span>
          </div>
        </div>
        <LeerConfigurator
          kits={familyKits.map((k) => ({ id: k.id, title: k.title, fitment: k.fitment, family: k.family }))}
          kitModels={kitModels}
          kitBoms={kitBoms}
          quoteId={quoteId}
          returnUrl={returnUrl}
        />
      </div>
    </div>
  )
}
