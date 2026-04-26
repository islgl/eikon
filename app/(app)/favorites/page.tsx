import { getIcons } from '@/actions/icons'
import { LibraryView } from '@/components/icon-grid/library-view'

export default async function FavoritesPage() {
  const { icons, hasMore } = await getIcons('favorites')
  return <LibraryView icons={icons} hasMore={hasMore} collectionId="favorites" title="Favorites" />
}
