import { LOCATIONS } from '@/lib/mock/fixtures'
import { QuoteRequestForm } from '@/components/quote/QuoteRequestForm'

export const metadata = { title: 'Request a Quote — LEER' }

export default function QuoteRequestPage() {
  const activeLocations = LOCATIONS.filter((l) => l.status === 'active').map((l) => ({
    id: l.id,
    name: l.name,
    code: l.code,
    city: l.city,
    state: l.state,
    address: l.address,
    postal_code: l.postal_code,
    companies: l.companies ? { name: l.companies.name } : undefined,
  }))
  return <QuoteRequestForm locations={activeLocations} />
}
