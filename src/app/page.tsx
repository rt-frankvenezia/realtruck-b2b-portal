import { redirect } from 'next/navigation'
import { getCurrentUser, portalPathForRole } from '@/lib/auth'

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  redirect(portalPathForRole(user.profile.role))
}
