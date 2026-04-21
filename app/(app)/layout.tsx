import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCollections } from '@/actions/collections'
import { getTags } from '@/actions/icons'
import { AppShell } from '@/components/layout/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowedEmails.length > 0 && !allowedEmails.includes(user.email?.toLowerCase() ?? '')) {
    await supabase.auth.signOut()
    redirect('/auth/login?error=unauthorized')
  }

  const [collections, tags] = await Promise.all([getCollections(), getTags()])

  return (
    <AppShell collections={collections} tags={tags} user={user}>
      {children}
    </AppShell>
  )
}
