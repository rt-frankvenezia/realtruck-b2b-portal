'use server'

import { revalidatePath } from 'next/cache'
import { FIXTURE_MAP } from '@/lib/mock/client'

function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

type Result<T = null> = { data: T; error: null } | { data: null; error: { message: string } }

export async function actionCreateCompany(name: string, code: string): Promise<Result<{ id: string }>> {
  const now = new Date().toISOString()
  const id = randomUUID()
  const arr = FIXTURE_MAP['companies']
  if (!arr) return { data: null, error: { message: 'companies table not found' } }
  arr.push({ id, name, code, status: 'pending_provisioning', created_at: now, updated_at: now })
  revalidatePath('/admin', 'layout')
  return { data: { id }, error: null }
}

export async function actionCreateLocation(
  companyId: string,
  name: string,
  code: string,
  city: string,
  state: string,
): Promise<Result<{ id: string }>> {
  const now = new Date().toISOString()
  const id = randomUUID()
  const arr = FIXTURE_MAP['locations']
  if (!arr) return { data: null, error: { message: 'locations table not found' } }
  arr.push({ id, company_id: companyId, name, code, city, state, status: 'pending_approval', created_at: now, updated_at: now })
  revalidatePath('/admin', 'layout')
  return { data: { id }, error: null }
}

export async function actionApproveLocation(
  locationId: string,
  code: string,
  note?: string,
): Promise<Result> {
  const arr = FIXTURE_MAP['locations']
  if (!arr) return { data: null, error: { message: 'locations table not found' } }
  const now = new Date().toISOString()
  const idx = arr.findIndex((l: any) => l.id === locationId)
  if (idx === -1) return { data: null, error: { message: 'Location not found' } }
  arr[idx] = { ...arr[idx], status: 'active', code, internal_note: note ?? null, updated_at: now }
  revalidatePath('/admin', 'layout')
  return { data: null, error: null }
}

export async function actionRejectLocation(
  locationId: string,
  reason: string,
): Promise<Result> {
  const arr = FIXTURE_MAP['locations']
  if (!arr) return { data: null, error: { message: 'locations table not found' } }
  const now = new Date().toISOString()
  const idx = arr.findIndex((l: any) => l.id === locationId)
  if (idx === -1) return { data: null, error: { message: 'Location not found' } }
  arr[idx] = { ...arr[idx], status: 'rejected', rejection_reason: reason, updated_at: now }
  revalidatePath('/admin', 'layout')
  return { data: null, error: null }
}

export async function actionUpdateCompanyPricingGroup(
  companyId: string,
  pricingGroupId: string | null,
): Promise<Result> {
  const arr = FIXTURE_MAP['companies']
  if (!arr) return { data: null, error: { message: 'companies table not found' } }
  const now = new Date().toISOString()
  const idx = arr.findIndex((c: any) => c.id === companyId)
  if (idx === -1) return { data: null, error: { message: 'Company not found' } }
  arr[idx] = { ...arr[idx], pricing_group_id: pricingGroupId, updated_at: now }
  revalidatePath('/admin', 'layout')
  return { data: null, error: null }
}

export async function actionUpdateCompanyCatalog(
  companyId: string,
  catalogId: string | null,
  pricingGroupId: string | null,
  restrictionGroupId: string | null,
): Promise<Result> {
  const arr = FIXTURE_MAP['companies']
  if (!arr) return { data: null, error: { message: 'companies table not found' } }
  const now = new Date().toISOString()
  const idx = arr.findIndex((c: any) => c.id === companyId)
  if (idx === -1) return { data: null, error: { message: 'Company not found' } }
  arr[idx] = {
    ...arr[idx],
    catalog_id: catalogId,
    pricing_group_id: pricingGroupId,
    restriction_group_id: restrictionGroupId,
    updated_at: now,
  }
  revalidatePath('/admin', 'layout')
  return { data: null, error: null }
}

export async function actionUpdateCompanyNetSuiteId(
  companyId: string,
  netsuiteCustomerId: string | null,
): Promise<Result> {
  const arr = FIXTURE_MAP['companies']
  if (!arr) return { data: null, error: { message: 'companies table not found' } }
  const now = new Date().toISOString()
  const idx = arr.findIndex((c: any) => c.id === companyId)
  if (idx === -1) return { data: null, error: { message: 'Company not found' } }
  arr[idx] = { ...arr[idx], netsuite_customer_id: netsuiteCustomerId, updated_at: now }
  revalidatePath('/admin', 'layout')
  return { data: null, error: null }
}

export async function actionUpdateCompanyStatus(
  companyId: string,
  status: string,
): Promise<Result> {
  const arr = FIXTURE_MAP['companies']
  if (!arr) return { data: null, error: { message: 'companies table not found' } }
  const now = new Date().toISOString()
  const idx = arr.findIndex((c: any) => c.id === companyId)
  if (idx === -1) return { data: null, error: { message: 'Company not found' } }
  arr[idx] = { ...arr[idx], status, updated_at: now }
  revalidatePath('/admin', 'layout')
  return { data: null, error: null }
}
