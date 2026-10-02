export type DemoUser = {
  id: string
  name: string
  email: string
  role: string
  company_id: string | null
  avatarInitials: string
  company?: string
  dealerType?: string
}

export const DEMO_USERS: DemoUser[] = [
  // ── RealTruck Admin ──────────────────────────────────
  {
    id: '33333333-3333-3333-3333-000000000001',
    name: 'Jordan Reyes',
    email: 'jordan.reyes@realtruck.example',
    role: 'realtruck_admin',
    company_id: null,
    avatarInitials: 'JR',
    company: 'RealTruck',
    dealerType: 'RT Admin',
  },
  // ── ARE + Transactional (both) ────────────────────────
  {
    id: '33333333-3333-3333-3333-000000000002',
    name: 'Casey Whitfield',
    email: 'casey@bigskytruck.example',
    role: 'dealer_admin',
    company_id: '11111111-1111-1111-1111-000000000001',
    avatarInitials: 'CW',
    company: 'Big Sky Truck Outfitters',
    dealerType: 'ARE + Transactional',
  },
  {
    id: '33333333-3333-3333-3333-000000000003',
    name: 'Priya Nandakumar',
    email: 'priya@bigskytruck.example',
    role: 'location_admin',
    company_id: '11111111-1111-1111-1111-000000000001',
    avatarInitials: 'PN',
    company: 'Big Sky Truck Outfitters',
    dealerType: 'ARE + Transactional',
  },
  {
    id: '33333333-3333-3333-3333-000000000004',
    name: 'Marcus Ibe',
    email: 'marcus@bigskytruck.example',
    role: 'staff',
    company_id: '11111111-1111-1111-1111-000000000001',
    avatarInitials: 'MI',
    company: 'Big Sky Truck Outfitters',
    dealerType: 'ARE + Transactional',
  },
  // ── Transactional dealer with pending credit application ─
  {
    id: '33333333-3333-3333-3333-000000000009',
    name: 'Alex Rivera',
    email: 'alex@pacifictruck.example',
    role: 'dealer_admin',
    company_id: '11111111-1111-1111-1111-000000000005',
    avatarInitials: 'AR',
    company: 'Pacific Truck & Accessories',
    dealerType: 'Transactional (Credit Pending)',
  },
  // ── ARE-only (quotes, no transactional ordering) ─────
  {
    id: '33333333-3333-3333-3333-000000000008',
    name: 'Blake Sullivan',
    email: 'blake@summitcap.example',
    role: 'dealer_admin',
    company_id: '11111111-1111-1111-1111-000000000004',
    avatarInitials: 'BS',
    company: 'Summit Cap Outfitters',
    dealerType: 'ARE Only',
  },
  // ── Transactional-only (no ARE, ordering + credit) ───
  {
    id: '33333333-3333-3333-3333-000000000005',
    name: 'Dana Okafor',
    email: 'dana@lonestarcap.example',
    role: 'dealer_admin',
    company_id: '11111111-1111-1111-1111-000000000002',
    avatarInitials: 'DO',
    company: 'Lone Star Cap & Bed',
    dealerType: 'Transactional Only',
  },
]

