import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RestrictionGroupInfoForm } from '@/components/admin/RestrictionGroupInfoForm'
import { RestrictionRuleManager } from '@/components/admin/RestrictionRuleManager'
import { RestrictionAccessPreview } from '@/components/admin/RestrictionAccessPreview'
import { RestrictionGroupDealerAssignment } from '@/components/admin/RestrictionGroupDealerAssignment'

export default async function AdminRestrictionGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: group }, { data: rules }, { data: allCompanies }] = await Promise.all([
    supabase.from('restriction_groups').select('*').eq('id', id).maybeSingle(),
    supabase.from('restriction_rules').select('*').eq('restriction_group_id', id).order('target_type'),
    supabase.from('companies').select('id, name, restriction_group_id').order('name'),
  ])

  if (!group) notFound()

  const assignedCompanies = (allCompanies ?? []).filter((c) => c.restriction_group_id === id)
  const otherCompanies = (allCompanies ?? []).filter((c) => c.restriction_group_id !== id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/catalog-restrictions" className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to Catalog Restrictions
        </Link>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
        </CardHeader>
        <CardContent>
          <RestrictionGroupInfoForm group={group} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restriction Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <RestrictionRuleManager
            restrictionGroupId={group.id}
            rules={rules ?? []}
            defaultAccess={group.default_access}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <RestrictionAccessPreview restrictionGroupId={group.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dealers</CardTitle>
        </CardHeader>
        <CardContent>
          <RestrictionGroupDealerAssignment
            restrictionGroupId={group.id}
            assignedCompanies={assignedCompanies}
            otherCompanies={otherCompanies}
          />
        </CardContent>
      </Card>
    </div>
  )
}
