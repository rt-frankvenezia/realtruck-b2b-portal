import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { UserStatusSelect } from '@/components/admin/UserStatusSelect'
import { UserLocationAssignment } from '@/components/dealer/UserLocationAssignment'
import { USER_ROLE_LABEL, formatDate } from '@/lib/status-labels'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

export default async function DealerTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await getCurrentUser()
  const supabase = await createClient()

  const [{ data: member }, { data: assignedLocations }, { data: companyLocations }, { data: viewerLocations }] = await Promise.all([
    supabase.from('users').select('*').eq('id', id).maybeSingle(),
    supabase.from('user_locations').select('location_id, locations(name)').eq('user_id', id),
    supabase.from('locations').select('id, name').eq('company_id', viewer?.profile.company_id ?? ''),
    supabase.from('user_locations').select('location_id').eq('user_id', viewer?.authId ?? ''),
  ])

  if (!member) notFound()

  const availableLocations =
    viewer?.profile.role === 'location_admin'
      ? (companyLocations ?? []).filter((l) => (viewerLocations ?? []).some((vl) => vl.location_id === l.id))
      : (companyLocations ?? [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{member.name}</h1>
          <p className="text-muted-foreground">{USER_ROLE_LABEL[member.role]}</p>
        </div>
        <UserStatusSelect userId={member.id} status={member.status} />
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Details</h2>
          <p className="text-sm text-white/70">Role changes require a RealTruck admin.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p>{member.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Phone</p>
            <p>{member.phone_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Role</p>
            <Badge variant="outline">{USER_ROLE_LABEL[member.role]}</Badge>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Last Login</p>
            <p>{member.last_login_at ? formatDate(member.last_login_at) : 'Never'}</p>
          </div>
        </div>
      </div>

      {member.role === 'location_admin' && (
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h2 className="font-semibold text-white">Location Assignments</h2>
          </div>
          <div className={PANEL_BODY}>
            <UserLocationAssignment
              userId={member.id}
              assignedLocationIds={(assignedLocations ?? []).map((l) => l.location_id)}
              availableLocations={availableLocations}
            />
          </div>
        </div>
      )}
    </div>
  )
}
