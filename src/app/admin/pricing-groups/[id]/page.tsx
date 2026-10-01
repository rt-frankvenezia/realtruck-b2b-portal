import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CatalogPricingSection } from '@/components/admin/CatalogPricingSection'
import { PricingRuleManager } from '@/components/admin/PricingRuleManager'
import { formatDate } from '@/lib/status-labels'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

export default async function AdminPricingGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: pricingGroup }, { data: dealers }] = await Promise.all([
    supabase.from('pricing_groups').select('*').eq('id', id).maybeSingle(),
    supabase.from('companies').select('id, name, status').eq('pricing_group_id', id).order('name'),
  ])

  if (!pricingGroup) notFound()

  const [{ data: rulesRaw }, { data: baseTiers }] = await Promise.all([
    supabase
      .from('pricing_rules')
      .select('*, pricing_rule_tiers(*)')
      .eq('pricing_group_id', id)
      .order('target_type'),
    supabase
      .from('pricing_group_base_tiers')
      .select('*')
      .eq('pricing_group_id', id)
      .order('min_quantity'),
  ])

  const rules = (rulesRaw ?? []).map((r) => ({ ...r, pricing_rule_tiers: r.pricing_rule_tiers ?? [] }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pricing-groups" className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to Pricing Groups
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{pricingGroup.name}</h1>
          <Badge variant={pricingGroup.status === 'active' ? 'success' : 'secondary'}>
            {pricingGroup.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {pricingGroup.description && <p className="text-muted-foreground mt-1">{pricingGroup.description}</p>}
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Group Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3 p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Effective Date</p>
            <p>{pricingGroup.effective_date ? formatDate(pricingGroup.effective_date) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Base Discount</p>
            <p>{pricingGroup.base_discount}%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Created</p>
            <p>{formatDate(pricingGroup.created_at)}</p>
          </div>
        </div>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Base Discount &amp; Volume Tiers</h2>
        </div>
        <div className={PANEL_BODY}>
          <CatalogPricingSection pricingGroup={pricingGroup} baseTiers={baseTiers ?? []} />
        </div>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Pricing Rules</h2>
        </div>
        <div className={PANEL_BODY}>
          <PricingRuleManager pricingGroupId={pricingGroup.id} rules={rules} />
        </div>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Assigned Dealers</h2>
        </div>
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dealers ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No dealers assigned to this pricing group.
                  </TableCell>
                </TableRow>
              )}
              {(dealers ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Link href={`/admin/companies/${d.id}`} className="font-medium hover:underline">
                      {d.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'active' ? 'success' : d.status === 'pending_provisioning' ? 'warning' : 'secondary'}>
                      {d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
    </div>
  )
}
