import { getIcons } from '@/actions/icons'
import { LibraryView } from '@/components/icon-grid/library-view'

export default async function LibraryPage() {
  const icons = await getIcons()
  return <LibraryView icons={icons} collectionId={null} title="All Icons" />
}
