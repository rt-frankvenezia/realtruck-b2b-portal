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
  RESTRICTION_GROUPS,
  AUDIT_LOG,
  CREDIT_APPLICATIONS,
} from './fixtures'
import { DEMO_USERS } from './session'

const FIXTURE_MAP: Record<string, any[]> = {
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
  restriction_groups: RESTRICTION_GROUPS,
  audit_log: AUDIT_LOG,
  credit_applications: CREDIT_APPLICATIONS,
}

function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

type Filter = { col: string; op: string; val: any }

class MockQueryBuilder {
  private table: string
  private filters: Filter[] = []
  private orderCol: string | null = null
  private orderAsc = true
  private limitN: number | null = null
  private isSingle = false
  private isMaybeSingle = false
  private isCountHead = false
  private insertData: any | null = null
  private updateData: any | null = null
  private isDelete = false
  private selectedCols: string | null = null

  constructor(table: string) {
    this.table = table
  }

  select(cols?: string, opts?: { count?: string; head?: boolean }) {
    this.selectedCols = cols ?? null
    if (opts?.count === 'exact' && opts?.head) {
      this.isCountHead = true
    }
    return this
  }

  eq(col: string, val: any) {
    this.filters.push({ col, op: 'eq', val })
    return this
  }

  neq(col: string, val: any) {
    this.filters.push({ col, op: 'neq', val })
    return this
  }

  in(col: string, vals: any[]) {
    this.filters.push({ col, op: 'in', val: vals })
    return this
  }

  not(col: string, op: string, val: any) {
    this.filters.push({ col, op: `not_${op}`, val })
    return this
  }

  is(col: string, val: any) {
    this.filters.push({ col, op: 'is', val })
    return this
  }

  ilike(col: string, pattern: string) {
    this.filters.push({ col, op: 'ilike', val: pattern })
    return this
  }

  gt(col: string, val: any) {
    this.filters.push({ col, op: 'gt', val })
    return this
  }

  gte(col: string, val: any) {
    this.filters.push({ col, op: 'gte', val })
    return this
  }

  lt(col: string, val: any) {
    this.filters.push({ col, op: 'lt', val })
    return this
  }

  lte(col: string, val: any) {
    this.filters.push({ col, op: 'lte', val })
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.orderAsc = opts?.ascending !== false
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isMaybeSingle = true
    return this
  }

  insert(data: any) {
    this.insertData = data
    return this
  }

  update(data: any) {
    this.updateData = data
    return this
  }

  delete() {
    this.isDelete = true
    return this
  }

  upsert(data: any) {
    this.insertData = data
    return this
  }

  private applyFilters(rows: any[]): any[] {
    let result = [...rows]
    for (const f of this.filters) {
      result = result.filter((row) => {
        const v = row[f.col]
        switch (f.op) {
          case 'eq':
            return v === f.val
          case 'neq':
            return v !== f.val
          case 'in':
            return Array.isArray(f.val) && f.val.includes(v)
          case 'is':
            return f.val === null ? v === null || v === undefined : v === f.val
          case 'not_is':
            return f.val === null ? v !== null && v !== undefined : v !== f.val
          case 'ilike': {
            const pattern = (f.val as string).replace(/%/g, '.*').replace(/_/g, '.')
            return typeof v === 'string' && new RegExp(pattern, 'i').test(v)
          }
          case 'gt':
            return v > f.val
          case 'gte':
            return v >= f.val
          case 'lt':
            return v < f.val
          case 'lte':
            return v <= f.val
          default:
            return true
        }
      })
    }
    return result
  }

  private execute(): { data: any; error: any; count?: number } {
    if (this.isDelete) {
      return { data: null, error: null }
    }

    if (this.insertData !== null) {
      const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData]
      const withIds = items.map((item: any) => ({ id: randomUUID(), ...item }))
      if (this.isSingle || this.isMaybeSingle) {
        return { data: withIds[0] ?? null, error: null }
      }
      return { data: withIds, error: null }
    }

    if (this.updateData !== null) {
      return { data: this.updateData, error: null }
    }

    const base = FIXTURE_MAP[this.table] ?? []
    let rows = this.applyFilters(base)

    if (this.orderCol) {
      const col = this.orderCol
      const asc = this.orderAsc
      rows = [...rows].sort((a, b) => {
        const av = a[col]
        const bv = b[col]
        if (av === bv) return 0
        const less = av < bv ? -1 : 1
        return asc ? less : -less
      })
    }

    if (this.limitN !== null) {
      rows = rows.slice(0, this.limitN)
    }

    if (this.isCountHead) {
      return { data: null, error: null, count: rows.length }
    }

    if (this.isSingle) {
      const row = rows[0] ?? null
      return row
        ? { data: row, error: null }
        : { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
    }

    if (this.isMaybeSingle) {
      return { data: rows[0] ?? null, error: null }
    }

    return { data: rows, error: null, count: rows.length }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any | TResult> {
    return Promise.resolve(this.execute()).catch(onrejected)
  }

  finally(onfinally?: (() => void) | null): Promise<any> {
    return Promise.resolve(this.execute()).finally(onfinally)
  }
}

export function createMockClient(userId?: string) {
  const resolvedUserId = userId ?? DEMO_USERS[0].id
  const demoUser = DEMO_USERS.find((u) => u.id === resolvedUserId) ?? DEMO_USERS[0]

  const client = {
    from(table: string) {
      return new MockQueryBuilder(table)
    },

    async rpc(name: string, params?: Record<string, any>) {
      switch (name) {
        case 'get_pricing_schedule':
          return {
            data: [
              { min_quantity: 1, discount_percent: 5 },
              { min_quantity: 5, discount_percent: 8 },
              { min_quantity: 10, discount_percent: 12 },
            ],
            error: null,
          }

        case 'check_product_purchase_access':
          return { data: { allowed: true }, error: null }

        case 'validate_order_credit': {
          const isBigSky = demoUser.company_id === '11111111-1111-1111-1111-000000000001'
          if (isBigSky) {
            return {
              data: { approved: true, available_credit: 65150, credit_limit: 75000 },
              error: null,
            }
          }
          return { data: { approved: false, available_credit: 0 }, error: null }
        }

        case 'validate_cart_restrictions':
          return { data: { valid: true, violations: [] }, error: null }

        case 'place_wholesale_order':
          return {
            data: {
              order_id: `demo-order-${Date.now()}`,
              order_number: 'RT-2026-DEMO',
            },
            error: null,
          }

        case 'admin_dealer_health':
          return {
            data: {
              total_dealers: 3,
              active_dealers: 2,
              pending_companies: 1,
              open_quotes: 4,
              installations_in_progress: 2,
              past_due_invoices: 3,
            },
            error: null,
          }

        case 'installation_kpi_metrics':
          return {
            data: {
              installs_this_month: 3,
              revenue_this_month: 2400,
              avg_days_to_complete: 8,
              pending_payouts: 1,
            },
            error: null,
          }

        case 'installation_verification_status':
          return {
            data: { can_submit: true, missing_checklist: [], missing_photos: [] },
            error: null,
          }

        case 'get_customer_facing_status':
          return {
            data: { status: 'Scheduled', detail: 'Your installation is scheduled' },
            error: null,
          }

        default:
          return { data: { success: true }, error: null }
      }
    },

    auth: {
      async getUser() {
        return {
          data: { user: { id: resolvedUserId, email: demoUser.email } },
          error: null,
        }
      },

      async signInWithPassword({ email }: { email: string; password?: string }) {
        const match = DEMO_USERS.find((u) => u.email === email)
        if (!match) {
          return { data: null, error: { message: 'Invalid credentials' } }
        }
        return { data: { user: { id: match.id } }, error: null }
      },

      async signOut() {
        return { error: null }
      },
    },

    storage: {
      from(_bucket: string) {
        return {
          async upload(_path: string, _file: any) {
            return { data: { path: 'demo-path' }, error: null }
          },
          async createSignedUrl(_path: string, _expiry?: number) {
            return { data: { signedUrl: 'https://picsum.photos/400/300' }, error: null }
          },
          async remove(_paths: string[]) {
            return { data: null, error: null }
          },
          async list(_prefix?: string) {
            return { data: [], error: null }
          },
        }
      },
    },
  }

  return client
}
