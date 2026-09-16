import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CatalogInfoForm } from '@/components/admin/CatalogInfoForm'
import { CatalogPricingSection } from '@/components/admin/CatalogPricingSection'
import { CatalogAvailabilitySection } from '@/components/admin/CatalogAvailabilitySection'
import { CatalogPreview } from '@/components/admin/CatalogPreview'
import { PricingRuleManager } from '@/components/admin/PricingRuleManager'
import { RestrictionRuleManager } from '@/components/admin/RestrictionRuleManager'
import { PURCHASE_ACCESS_LABEL } from '@/lib/restrictions'

export default async function AdminCatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: catalog },
    { data: programs },
  ] = await Promise.all([
    supabase.from('catalogs').select('*').eq('id', id).maybeSingle(),
    supabase.from('dealer_programs').select('id, name, catalog_id').order('name'),
  ])

  if (!catalog) notFound()

  const assignedPrograms = (programs ?? []).filter((p) => p.catalog_id === id)

  // Fetch the underlying pricing and restriction group data
  const [pricingGroupRes, restrictionGroupRes] = await Promise.all([
    catalog.pricing_group_id
      ? supabase.from('pricing_groups').select('*').eq('id', catalog.pricing_group_id).maybeSingle()
      : Promise.resolve({ data: null }),
    catalog.restriction_group_id
      ? supabase.from('restriction_groups').select('*').eq('id', catalog.restriction_group_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Fetch pricing rules and restriction rules in parallel
  const [rulesRes, baseTiersRes, restrictionRulesRes] = await Promise.all([
    catalog.pricing_group_id
      ? supabase
          .from('pricing_rules')
          .select('*, pricing_rule_tiers(*)')
          .eq('pricing_group_id', catalog.pricing_group_id)
          .order('target_type')
      : Promise.resolve({ data: [] }),
    catalog.pricing_group_id
      ? supabase
          .from('pricing_group_base_tiers')
          .select('*')
          .eq('pricing_group_id', catalog.pricing_group_id)
          .order('min_quantity')
      : Promise.resolve({ data: [] }),
    catalog.restriction_group_id
      ? supabase
          .from('restriction_rules')
          .select('*')
          .eq('restriction_group_id', catalog.restriction_group_id)
          .order('target_type')
      : Promise.resolve({ data: [] }),
  ])

  const pricingGroup = pricingGroupRes.data
  const restrictionGroup = restrictionGroupRes.data
  const pricingRules = (rulesRes.data ?? []).map((r) => ({ ...r, pricing_rule_tiers: r.pricing_rule_tiers ?? [] }))
  const baseTiers = baseTiersRes.data ?? []
  const restrictionRules = restrictionRulesRes.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/catalogs" className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to Catalogs
        </Link>
        <h1 className="text-2xl font-semibold">{catalog.name}</h1>
        {catalog.description && <p className="text-muted-foreground mt-1">{catalog.description}</p>}
      </div>

      {/* Catalog Information */}
      <Card>
        <CardHeader>
          <CardTitle>Catalog Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CatalogInfoForm catalog={catalog} />
        </CardContent>
      </Card>

      {/* Pricing section */}
      {pricingGroup ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Pricing — Base Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogPricingSection pricingGroup={pricingGroup} baseTiers={baseTiers} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <PricingRuleManager pricingGroupId={pricingGroup.id} rules={pricingRules} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No pricing configuration attached to this catalog.</p>
          </CardContent>
        </Card>
      )}

      {/* Availability section */}
      {restrictionGroup ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Availability — Default Access</CardTitle>
                <Badge variant={restrictionGroup.default_access === 'allowed' ? 'success' : 'destructive'}>
                  {PURCHASE_ACCESS_LABEL[restrictionGroup.default_access]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CatalogAvailabilitySection restrictionGroup={restrictionGroup} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <RestrictionRuleManager
                restrictionGroupId={restrictionGroup.id}
                rules={restrictionRules}
                defaultAccess={restrictionGroup.default_access}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No availability configuration attached to this catalog.</p>
          </CardContent>
        </Card>
      )}

      {/* Combined preview */}
      {pricingGroup && restrictionGroup && (
        <Card>
          <CardHeader>
            <CardTitle>Catalog Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <CatalogPreview
              pricingGroupId={pricingGroup.id}
              restrictionGroupId={restrictionGroup.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Dealer Programs using this catalog */}
      <Card>
        <CardHeader>
          <CardTitle>Dealer Programs</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedPrograms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No dealer programs are using this catalog.{' '}
              <Link href="/admin/dealer-programs" className="text-primary hover:underline">
                Assign it from a Dealer Program.
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedPrograms.map((p) => (
                <Link key={p.id} href={`/admin/dealer-programs/${p.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    {p.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
