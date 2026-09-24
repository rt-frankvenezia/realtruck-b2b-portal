export type DemoUser = {
  id: string
  name: string
  email: string
  role: string
  company_id: string | null
  avatarInitials: string
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: '33333333-3333-3333-3333-000000000002',
    name: 'Casey Whitfield',
    email: 'casey@bigskytruck.example',
    role: 'dealer_admin',
    company_id: '11111111-1111-1111-1111-000000000001',
    avatarInitials: 'CW',
  },
  {
    id: '33333333-3333-3333-3333-000000000001',
    name: 'Jordan Reyes',
    email: 'jordan.reyes@realtruck.example',
    role: 'realtruck_admin',
    company_id: null,
    avatarInitials: 'JR',
  },
  {
    id: '33333333-3333-3333-3333-000000000003',
    name: 'Priya Nandakumar',
    email: 'priya@bigskytruck.example',
    role: 'location_admin',
    company_id: '11111111-1111-1111-1111-000000000001',
    avatarInitials: 'PN',
  },
  {
    id: '33333333-3333-3333-3333-000000000004',
    name: 'Marcus Ibe',
    email: 'marcus@bigskytruck.example',
    role: 'staff',
    company_id: '11111111-1111-1111-1111-000000000001',
    avatarInitials: 'MI',
  },
  {
    id: '33333333-3333-3333-3333-000000000005',
    name: 'Dana Okafor',
    email: 'dana@lonestarcap.example',
    role: 'dealer_admin',
    company_id: '11111111-1111-1111-1111-000000000002',
    avatarInitials: 'DO',
  },
]

