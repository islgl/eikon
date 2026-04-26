import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getIcons } from '@/actions/icons'
import { LibraryView } from '@/components/icon-grid/library-view'

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .single()

  if (!collection) notFound()

  const { icons, hasMore } = await getIcons(collectionId)
  const title = `${collection.emoji ?? ''} ${collection.name}`.trim()

  return <LibraryView icons={icons} hasMore={hasMore} collectionId={collectionId} title={title} />
}
