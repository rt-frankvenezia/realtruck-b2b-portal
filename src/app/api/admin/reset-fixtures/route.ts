import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  PRODUCT_CATEGORIES,
  CATALOG_PRODUCTS,
  CATALOG_PRODUCT_INVENTORY,
  FULFILLMENT_LOCATIONS,
  SKU_FITMENT,
  COMPANIES,
  LOCATIONS,
  USERS,
  USER_LOCATIONS,
  CREDIT_ACCOUNTS,
  INVOICES,
  INVOICE_LINE_ITEMS,
  PAYMENTS,
  PAYMENT_ALLOCATIONS,
  BANK_ACCOUNTS,
  SAVED_PAYMENT_METHODS,
  SAVED_PAYMENT_METHOD_LOCATIONS,
  PRODUCT_ORDERS,
  PRODUCT_ORDER_ITEMS,
  QUOTES,
  QUOTE_LINE_ITEMS,
  INSTALLATIONS,
  RESOURCES,
  WARRANTY_REGISTRATIONS,
  STATEMENTS,
  CATALOGS,
  PRICING_GROUPS,
  PRICING_GROUP_BASE_TIERS,
  PRICING_RULES,
  PRICING_RULE_TIERS,
  RESTRICTION_GROUPS,
  RESTRICTION_RULES,
  AUDIT_LOG,
  CREDIT_APPLICATIONS,
  QUOTE_ACTIVITY,
} from '@/lib/mock/fixtures'

const SEEDS: Record<string, any[]> = {
  product_categories: PRODUCT_CATEGORIES,
  catalog_products: CATALOG_PRODUCTS,
  catalog_product_inventory: CATALOG_PRODUCT_INVENTORY,
  fulfillment_locations: FULFILLMENT_LOCATIONS,
  sku_fitment: SKU_FITMENT,
  companies: COMPANIES,
  locations: LOCATIONS,
  users: USERS,
  user_locations: USER_LOCATIONS,
  credit_accounts: CREDIT_ACCOUNTS,
  invoices: INVOICES,
  invoice_line_items: INVOICE_LINE_ITEMS,
  payments: PAYMENTS,
  payment_allocations: PAYMENT_ALLOCATIONS,
  bank_accounts: BANK_ACCOUNTS,
  saved_payment_methods: SAVED_PAYMENT_METHODS,
  saved_payment_method_locations: SAVED_PAYMENT_METHOD_LOCATIONS,
  product_orders: PRODUCT_ORDERS,
  product_order_items: PRODUCT_ORDER_ITEMS,
  quotes: QUOTES,
  quote_line_items: QUOTE_LINE_ITEMS,
  installations: INSTALLATIONS,
  resources: RESOURCES,
  warranty_registrations: WARRANTY_REGISTRATIONS,
  statements: STATEMENTS,
  catalogs: CATALOGS,
  pricing_groups: PRICING_GROUPS,
  pricing_group_base_tiers: PRICING_GROUP_BASE_TIERS,
  pricing_rules: PRICING_RULES,
  pricing_rule_tiers: PRICING_RULE_TIERS,
  restriction_groups: RESTRICTION_GROUPS,
  restriction_rules: RESTRICTION_RULES,
  audit_log: AUDIT_LOG,
  credit_applications: CREDIT_APPLICATIONS,
  quote_activity: QUOTE_ACTIVITY,
}

// Resets all fixture arrays in-place so existing FIXTURE_MAP references stay valid.
export async function POST() {
  const g = globalThis as any
  const fm = g.__rtFixtureMap
  if (!fm) return NextResponse.json({ ok: true, message: 'Nothing to reset — no live fixture map found' })

  for (const [key, seed] of Object.entries(SEEDS)) {
    const arr = fm[key]
    if (Array.isArray(arr)) {
      arr.length = 0
      arr.push(...seed)
    }
  }

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
