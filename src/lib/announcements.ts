export type Announcement = {
  id: string
  date: string
  title: string
  tag: string
  body: string
  scope: 'are' | 'transactional'
}

export const ALL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    date: '2026-10-01',
    title: 'New A.R.E. MX-Series now available for 2025 Toyota Tacoma — order lead time 6–8 weeks',
    tag: 'Product',
    scope: 'are',
    body: 'The A.R.E. MX-Series is now orderable for the 2025 Toyota Tacoma in all standard configurations. Current lead time is 6–8 weeks from order confirmation. All color and option combinations are available. Contact your regional rep to confirm availability for your market or to place a priority order.',
  },
  {
    id: 'ann-002',
    date: '2026-10-01',
    title: 'October promotional pricing is now active — check your pricing group for current discounts',
    tag: 'Pricing',
    scope: 'transactional',
    body: 'October promotional pricing is now live across all eligible SKUs. Log in to the product catalog to see updated pricing for your tier. Promotional pricing runs through October 31, 2026. Contact your account manager with any questions about your pricing group eligibility or to request a pricing review.',
  },
  {
    id: 'ann-003',
    date: '2026-09-25',
    title: 'Standard shipping lead times: 5–7 business days through Q4 2026',
    tag: 'Shipping',
    scope: 'transactional',
    body: 'Effective immediately, standard ground shipping lead times are 5–7 business days through the end of Q4 2026 due to increased seasonal volume. Expedited shipping options remain available at standard rates. Please plan your inventory orders accordingly to avoid stock-outs during the peak holiday season.',
  },
  {
    id: 'ann-004',
    date: '2026-09-22',
    title: 'Q4 lead response goal: acknowledge all new leads within 24 hours of submission',
    tag: 'Operations',
    scope: 'are',
    body: 'As part of our Q4 dealer performance initiative, RealTruck is asking all A.R.E. dealers to acknowledge new quote leads within 24 hours of submission. Dealers consistently meeting this target will be highlighted in the Q4 dealer performance report. The quote management tool now displays lead age prominently to help your team stay on track.',
  },
  {
    id: 'ann-005',
    date: '2026-09-18',
    title: 'New SKUs added: UnderCover Elite LX Hard Cover lineup for 2025 Ford F-150',
    tag: 'Product',
    scope: 'transactional',
    body: "Ten new SKUs for the UnderCover Elite LX Hard Cover have been added to the catalog for the 2025 Ford F-150 (5'7\" and 6'6\" bed lengths). These are available for order immediately. Visit the product catalog to see full specs, fitment details, pricing, and availability for your region.",
  },
  {
    id: 'ann-006',
    date: '2026-09-10',
    title: '3D Configurator update: eight new exterior colors added for MX and DS Series',
    tag: 'Tools',
    scope: 'are',
    body: 'The A.R.E. 3D Configurator has been updated with eight new exterior color options for the MX-Series and DS-Series product lines. New colors include Magnetic Gray Metallic, Slate Gray, and six additional factory-matched options. Customers can now visualize all available colors in real time before submitting a quote request.',
  },
  {
    id: 'ann-007',
    date: '2026-09-05',
    title: 'Net 30 payment terms renewal — contact your rep if your annual credit review is approaching',
    tag: 'Billing',
    scope: 'transactional',
    body: 'Annual credit reviews for Net 30 payment terms are rolling through Q4. If your credit line is up for renewal in the next 60 days, contact your account manager to initiate the review process early. Dealers with completed and approved reviews will see no interruption to their payment terms. Reviews typically take 5–7 business days to process.',
  },
  {
    id: 'ann-008',
    date: '2026-08-28',
    title: 'Warranty registration now requires online submission within 30 days of installation',
    tag: 'Policy',
    scope: 'are',
    body: 'Effective September 1, 2026, all A.R.E. product warranty registrations must be submitted online within 30 days of installation. Paper registrations will no longer be accepted. Registrations submitted outside the 30-day window may result in reduced warranty coverage for your customers. The online registration portal is accessible through your dealer resources dashboard.',
  },
]

export function getAnnouncements(isAreDealer: boolean, isTransactional: boolean): Announcement[] {
  return ALL_ANNOUNCEMENTS.filter((a) => {
    if (a.scope === 'are') return isAreDealer
    if (a.scope === 'transactional') return isTransactional
    return false
  })
}
