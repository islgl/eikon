import { getIcons } from '@/actions/icons'
import { LibraryView } from '@/components/icon-grid/library-view'

export default async function FavoritesPage() {
  const icons = await getIcons('favorites')
  return <LibraryView icons={icons} collectionId="favorites" title="Favorites" />
}
