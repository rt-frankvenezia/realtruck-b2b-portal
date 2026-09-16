import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PricingGroupInfoForm } from '@/components/admin/PricingGroupInfoForm'
import { PricingRuleManager } from '@/components/admin/PricingRuleManager'
import { PricingCalculatorPreview } from '@/components/admin/PricingCalculatorPreview'
import { PricingGroupDealerAssignment } from '@/components/admin/PricingGroupDealerAssignment'

export default async function AdminPricingGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: group }, { data: rules }, { data: allCompanies }, { data: baseTiers }] = await Promise.all([
    supabase.from('pricing_groups').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('pricing_rules')
      .select('*, pricing_rule_tiers(*)')
      .eq('pricing_group_id', id)
      .order('target_type'),
    supabase.from('companies').select('id, name, pricing_group_id').order('name'),
    supabase.from('pricing_group_base_tiers').select('*').eq('pricing_group_id', id).order('min_quantity'),
  ])

  if (!group) notFound()

  const assignedCompanies = (allCompanies ?? []).filter((c) => c.pricing_group_id === id)
  const otherCompanies = (allCompanies ?? []).filter((c) => c.pricing_group_id !== id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pricing-groups" className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to Price Groups
        </Link>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingGroupInfoForm group={group} baseTiers={baseTiers ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingRuleManager
            pricingGroupId={group.id}
            rules={(rules ?? []).map((r) => ({
              ...r,
              pricing_rule_tiers: r.pricing_rule_tiers ?? [],
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingCalculatorPreview pricingGroupId={group.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dealers</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingGroupDealerAssignment pricingGroupId={group.id} assignedCompanies={assignedCompanies} otherCompanies={otherCompanies} />
        </CardContent>
      </Card>
    </div>
  )
}
