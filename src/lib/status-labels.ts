import type { Database } from '@/lib/database.types'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export const DEALER_STATUS_LABEL: Record<Database['public']['Enums']['dealer_operational_status'], string> = {
  requested: 'Requested',
  scheduling_proposed: 'Scheduling Proposed',
  customer_requested_change: 'Customer Requested Change',
  scheduled: 'Scheduled',
  cap_in_transit: 'Cap In Transit',
  cap_delivered: 'Cap Delivered',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const DEALER_STATUS_VARIANT: Record<Database['public']['Enums']['dealer_operational_status'], BadgeVariant> = {
  requested: 'outline',
  scheduling_proposed: 'secondary',
  customer_requested_change: 'secondary',
  scheduled: 'secondary',
  cap_in_transit: 'secondary',
  cap_delivered: 'secondary',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'destructive',
}

export const QUOTE_STATUS_LABEL: Record<Database['public']['Enums']['quote_status'], string> = {
  new: 'New',
  working: 'Working',
  quote_sent: 'Quote Sent',
  converted: 'Converted',
  lost: 'Lost',
  spam: 'Spam',
  invalid: 'Invalid',
  test: 'Test',
}

export const QUOTE_STATUS_VARIANT: Record<Database['public']['Enums']['quote_status'], BadgeVariant> = {
  new: 'outline',
  working: 'secondary',
  quote_sent: 'secondary',
  converted: 'default',
  lost: 'destructive',
  spam: 'destructive',
  invalid: 'destructive',
  test: 'outline',
}

export const PAYOUT_STATUS_LABEL: Record<Database['public']['Enums']['payout_status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export const PAYOUT_STATUS_VARIANT: Record<Database['public']['Enums']['payout_status'], BadgeVariant> = {
  pending: 'outline',
  processing: 'secondary',
  paid: 'default',
  failed: 'destructive',
  cancelled: 'destructive',
}

export const CONFIRMATION_STATUS_LABEL: Record<Database['public']['Enums']['confirmation_status'], string> = {
  pending: 'Awaiting Confirmation',
  confirmed: 'Confirmed',
  issue_reported: 'Issue Reported',
}

export const PHOTO_CATEGORY_LABEL: Record<Database['public']['Enums']['photo_category'], string> = {
  full_vehicle: 'Full Vehicle with Installed Cap',
  rear_view: 'Rear View (Door Alignment)',
  side_profile: 'Side Profile',
  front_clamp: 'Front Clamp/Attachment Zone',
  wiring: 'Wiring/Electrical Connection',
  accessories: 'Installed Accessories',
}

export const CHECKLIST_ITEM_LABEL: Record<Database['public']['Enums']['checklist_item_key'], string> = {
  correct_cap_model: 'Correct cap model installed',
  options_installed: 'All selected options/accessories installed',
  mechanical_tested: 'All mechanical components tested',
  electrical_tested: 'Electrical components tested (if applicable)',
  no_leaks_or_fitment_issues: 'No leaks or fitment issues',
  customer_inspected: 'Customer inspected installation',
  warranty_instructions_provided: 'Provided warranty and care instructions',
  answered_questions: 'Answered all customer questions',
}

export const ISSUE_TYPE_LABEL: Record<Database['public']['Enums']['issue_type'], string> = {
  poor_fitment: 'Poor Fitment',
  damage: 'Damage',
  missing_accessory: 'Missing Accessory',
  electrical: 'Electrical Issue',
  wrong_cap_or_options: 'Wrong Cap or Wrong Options',
  other: 'Other',
}

export function formatCurrency(amount: number | string | null): string {
  if (amount === null) return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
