import { redirect } from 'next/navigation'

// The homepage (/) now handles the logged-out login experience directly
// (see src/app/page.tsx's LoggedOutHome), so this route is just a shim for
// existing redirect('/login') call sites elsewhere in the app.
export default function LoginPage() {
  redirect('/#login')
}
