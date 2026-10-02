import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getAnnouncements } from '@/lib/announcements'
import { AnnouncementsPageList } from '@/components/dealer/AnnouncementsPanel'

export default async function AnnouncementsPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const companyId = user?.profile.company_id ?? null

  let isAreDealer = false
  let isTransactional = true
  if (companyId) {
    const { data: company } = await supabase
      .from('companies')
      .select('is_are_dealer, credit_eligible')
      .eq('id', companyId)
      .maybeSingle()
    isAreDealer = Boolean(company?.is_are_dealer)
    isTransactional = !isAreDealer || Boolean(company?.credit_eligible)
  }

  const announcements = getAnnouncements(isAreDealer, isTransactional)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <p className="text-muted-foreground">Updates and notices from RealTruck.</p>
      </div>
      <AnnouncementsPageList announcements={announcements} />
    </div>
  )
}
