// Catalog Restrictions: purchasing eligibility logic.
// Resolution always happens server-side via check_product_purchase_access RPC.
// These types are shared by admin UI and storefront enforcement.

export type PurchaseAccess = 'allowed' | 'not_allowed'

export type RestrictionResult = {
  access: PurchaseAccess
  source: string
}

export const PURCHASE_ACCESS_LABEL: Record<PurchaseAccess, string> = {
  allowed: 'Allowed',
  not_allowed: 'Not Allowed',
}
