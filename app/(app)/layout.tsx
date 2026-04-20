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

  const [collections, tags] = await Promise.all([getCollections(), getTags()])

  return (
    <AppShell collections={collections} tags={tags} user={user}>
      {children}
    </AppShell>
  )
}
