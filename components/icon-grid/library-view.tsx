'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Icon, ImportItem } from '@/types'
import { useIcons } from '@/lib/hooks/use-icons'
import { useDndMove } from '@/lib/hooks/use-dnd-move'
import { moveIcons } from '@/actions/icons'
import { importIcons } from '@/actions/import'
import { sanitizeSvg, extractSvgName } from '@/lib/utils/svg'
import { ACCEPTED_IMAGE_TYPES, isSvgFile, isIcnsFile, icnsFileToSvgContent, rasterFileToSvgContent } from '@/lib/utils/image'
import { IconToolbar } from './icon-toolbar'
import { IconGrid } from './icon-grid'
import { EmptyDropzone } from './empty-dropzone'
import { IconDetailPanel } from '@/components/icon-detail/icon-detail-panel'
import { ImportDialog } from '@/components/import/import-dialog'
import type { ViewMode } from '@/types'

type LibraryViewProps = {
  icons: Icon[]
  hasMore: boolean
  collectionId: string | null
  title: string
}

export function LibraryView({ icons: initialIcons, hasMore: initialHasMore, collectionId, title }: LibraryViewProps) {
  const [iconSize, setIconSize] = useState(64)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [detailIconId, setDetailIconId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const iconState = useIcons({ initialIcons, initialHasMore, collectionId })
  const { register } = useDndMove()
  const { removeIcons } = iconState

  useEffect(() => {
    register(async (iconIds, targetCollectionId) => {
      removeIcons(iconIds)
      await moveIcons(iconIds, targetCollectionId)
    })
  }, [register, removeIcons])

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) {
      toast.error('No supported files found')
      return
    }
    try {
      const items: ImportItem[] = await Promise.all(
        accepted.map(async (file): Promise<ImportItem> => ({
          name: extractSvgName(file.name),
          svgContent: isSvgFile(file)
            ? sanitizeSvg(await file.text())
            : isIcnsFile(file)
              ? await icnsFileToSvgContent(file)
              : await rasterFileToSvgContent(file),
          collectionId,
          source: 'upload' as const,
        }))
      )
      const result = await importIcons(items)
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} icon${result.imported > 1 ? 's' : ''}`)
        iconState.addIcons(result.icons)
      }
      if (result.skipped > 0) toast.info(`Skipped ${result.skipped} duplicate${result.skipped > 1 ? 's' : ''}`)
      if (result.errors.length > 0) toast.error(`${result.errors.length} failed`)
    } catch {
      toast.error('Import failed')
    }
  }, [collectionId, iconState.addIcons])

  const hasIcons = iconState.icons.length > 0

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    multiple: true,
    noClick: true,
    disabled: !hasIcons,
  })

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

      <div
        {...(hasIcons ? getRootProps() : {})}
        className="flex flex-1 min-h-0 relative outline-none"
      >
        {hasIcons && <input {...getInputProps()} />}

        {isDragActive && (
          <div className="absolute inset-0 z-20 pointer-events-none m-2 rounded-xl border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="h-8 w-8" />
              <p className="text-sm font-medium">Drop to import</p>
            </div>
          </div>
        )}

        {!hasIcons ? (
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
            hasMore={iconState.hasMore}
            isLoadingMore={iconState.isLoadingMore}
            onLoadMore={iconState.loadMore}
          />
        )}

        {detailIcon && (
          <IconDetailPanel
            icon={detailIcon}
            onClose={() => setDetailIconId(null)}
            onUpdate={(changes) => iconState.updateIcon(detailIcon.id, changes)}
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
