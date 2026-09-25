import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CatalogInfoForm } from '@/components/admin/CatalogInfoForm'
import { CatalogAvailabilitySection } from '@/components/admin/CatalogAvailabilitySection'
import { CatalogDealerAssignment } from '@/components/admin/CatalogDealerAssignment'
import { RestrictionRuleManager } from '@/components/admin/RestrictionRuleManager'
import { PURCHASE_ACCESS_LABEL } from '@/lib/restrictions'

export default async function AdminCatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: catalog }, { data: dealers }] = await Promise.all([
    supabase.from('catalogs').select('*').eq('id', id).maybeSingle(),
    supabase.from('companies').select('id, name, status').eq('catalog_id', id).order('name'),
  ])

  if (!catalog) notFound()

  const { data: restrictionGroup } = catalog.restriction_group_id
    ? await supabase.from('restriction_groups').select('*').eq('id', catalog.restriction_group_id).maybeSingle()
    : Promise.resolve({ data: null })

  const { data: restrictionRulesRaw } = catalog.restriction_group_id
    ? await supabase
        .from('restriction_rules')
        .select('*')
        .eq('restriction_group_id', catalog.restriction_group_id)
        .order('target_type')
    : Promise.resolve({ data: [] })

  const restrictionRules = restrictionRulesRaw ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/catalogs" className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to Catalogs
        </Link>
        <h1 className="text-2xl font-semibold">{catalog.name}</h1>
        {catalog.description && <p className="text-muted-foreground mt-1">{catalog.description}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CatalogInfoForm catalog={catalog} />
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Dealers</CardTitle>
        </CardHeader>
        <CardContent>
          <CatalogDealerAssignment
            catalogId={catalog.id}
            restrictionGroupId={catalog.restriction_group_id}
            initialDealers={dealers ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
