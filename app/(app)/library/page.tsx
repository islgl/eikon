import { getIcons } from '@/actions/icons'
import { LibraryView } from '@/components/icon-grid/library-view'

export default async function LibraryPage() {
  const { icons, hasMore } = await getIcons()
  return <LibraryView icons={icons} hasMore={hasMore} collectionId={null} title="All Icons" />
}
