'use client'

import { useState, useEffect } from 'react'
import type { Icon, Tag } from '@/types'
import { useIcons } from '@/lib/hooks/use-icons'
import { useDndMove } from '@/lib/hooks/use-dnd-move'
import { moveIcons } from '@/actions/icons'
import { IconToolbar } from './icon-toolbar'
import { IconGrid } from './icon-grid'
import { EmptyDropzone } from './empty-dropzone'
import { IconDetailPanel } from '@/components/icon-detail/icon-detail-panel'
import { ImportDialog } from '@/components/import/import-dialog'
import type { ViewMode } from '@/types'

type LibraryViewProps = {
  icons: Icon[]
  collectionId: string | null
  title: string
}

export function LibraryView({ icons: initialIcons, collectionId, title }: LibraryViewProps) {
  const [iconSize, setIconSize] = useState(64)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [detailIconId, setDetailIconId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const iconState = useIcons({ initialIcons, collectionId })
  const { register } = useDndMove()

  useEffect(() => {
    register(async (iconIds, targetCollectionId) => {
      iconState.removeIcons(iconIds)
      await moveIcons(iconIds, targetCollectionId)
    })
  }, [register, iconState.removeIcons])

  const detailIcon = detailIconId
    ? iconState.filteredIcons.find((i) => i.id === detailIconId) ?? null
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <IconToolbar
        title={title}
        query={iconState.query}
        onQueryChange={iconState.setQuery}
        iconSize={iconSize}
        onIconSizeChange={setIconSize}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortOrder={iconState.sortOrder}
        onSortOrderChange={iconState.setSortOrder}
        totalCount={iconState.filteredIcons.length}
        selectedCount={iconState.selectedIds.size}
        onSelectAll={iconState.selectAll}
        onClearSelection={iconState.clearSelection}
        onDeleteSelected={() => {
          iconState.removeIcons([...iconState.selectedIds])
          iconState.clearSelection()
        }}
        onImport={() => setImportOpen(true)}
        collectionId={collectionId}
      />

      <div className="flex flex-1 min-h-0">
        {iconState.icons.length === 0 ? (
          <EmptyDropzone
            collectionId={collectionId}
            onImported={iconState.addIcons}
            onOpenDialog={() => setImportOpen(true)}
          />
        ) : (
          <IconGrid
            icons={iconState.filteredIcons}
            iconSize={iconSize}
            viewMode={viewMode}
            selectedIds={iconState.selectedIds}
            activeIconId={detailIconId}
            onSelect={iconState.toggleSelect}
            onOpenDetail={(id) => setDetailIconId(id === detailIconId ? null : id)}
            onUpdateIcon={iconState.updateIcon}
            onRemoveIcons={iconState.removeIcons}
          />
        )}

        {detailIcon && (
          <IconDetailPanel
            icon={detailIcon}
            onClose={() => setDetailIconId(null)}
            onUpdate={(changes) => iconState.updateIcon(detailIcon.id, changes)}
            onDelete={() => {
              iconState.removeIcons([detailIcon.id])
              setDetailIconId(null)
            }}
          />
        )}
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultCollectionId={collectionId}
        onImported={iconState.addIcons}
      />
    </div>
  )
}
