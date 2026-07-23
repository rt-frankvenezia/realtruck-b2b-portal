// Credit/invoicing docs (05-financial-permissions.md §2): capability-based
// financial permissions, mirroring the existing ROLE_PERMISSIONS derived-
// function pattern in status-labels.ts rather than a new permissions table
// (no capability/permission table exists anywhere in this repo, and the
// docs themselves say the mapping "requires future business confirmation" —
// a lightweight derived function is the right-sized answer).
//
// Location scoping (docs §5): view_invoices/download_invoices are granted
// to location_admin here, but the actual query must still filter by
// current_location_ids() — this function only says *whether* a role has the
// capability at all, not what it's scoped to. RLS enforces the real
// boundary; this drives nav visibility and route guards.

import type { Database } from '@/lib/database.types'

export type FinancialPermission =
  | 'submit_credit_application'
  | 'view_credit_status'
  | 'view_credit_summary'
  | 'view_invoices'
  | 'download_invoices'
  | 'download_statements'
  | 'pay_invoices'
  | 'view_payments'
  | 'manage_bank_accounts'
  | 'request_credit_review'

type UserRole = Database['public']['Enums']['user_role']

const ROLE_FINANCIAL_PERMISSIONS: Record<UserRole, FinancialPermission[]> = {
  // Full financial access — this repo has no separate "financial user"
  // capability bundle/role, so dealer_admin covers it (docs §3: "Financial
  // User... may be a new capability bundle rather than a formal role").
  dealer_admin: [
    'submit_credit_application',
    'view_credit_status',
    'view_credit_summary',
    'view_invoices',
    'download_invoices',
    'download_statements',
    'pay_invoices',
    'view_payments',
    'manage_bank_accounts',
    'request_credit_review',
  ],
  // Docs §3 Location Admin: invoices/downloads for permitted locations only
  // (query-level scoping via current_location_ids(), enforced by RLS — see
  // invoices_select). Explicitly NOT granted: org-wide credit summary,
  // bank-account management, org-wide payments. Docs flag this mapping as
  // needing future business confirmation.
  location_admin: ['view_invoices', 'download_invoices'],
  // Docs §3 Dealer Staff: no financial access at all. May still place
  // wholesale orders — that's a separate (non-financial) capability.
  staff: [],
  // Docs §3 RealTruck Admin: dealer-facing screens for support/demo only,
  // not a new internal credit-review tool (explicitly out of scope).
  realtruck_admin: [
    'submit_credit_application',
    'view_credit_status',
    'view_credit_summary',
    'view_invoices',
    'download_invoices',
    'download_statements',
    'pay_invoices',
    'view_payments',
    'manage_bank_accounts',
    'request_credit_review',
  ],
  customer: [],
}

export function getFinancialPermissions(role: UserRole): FinancialPermission[] {
  return ROLE_FINANCIAL_PERMISSIONS[role]
}

export function hasFinancialPermission(role: UserRole, permission: FinancialPermission): boolean {
  return ROLE_FINANCIAL_PERMISSIONS[role].includes(permission)
}
