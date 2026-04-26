'use client'

import { useState, useEffect, useRef, type DragEvent } from 'react'
import { Loader2, Upload } from 'lucide-react'
import type { Icon } from '@/types'
import { useIcons } from '@/lib/hooks/use-icons'
import { useDndMove } from '@/lib/hooks/use-dnd-move'
import { moveIcons } from '@/actions/icons'
import { cn } from '@/lib/utils'
import { ACCEPTED_EXTENSIONS_LABEL } from '@/lib/utils/image'
import {
  buildDropOverlayLabel,
  hasExternalFiles,
  resolveImportCollectionId,
} from '@/lib/utils/direct-import'
import { runDirectImport } from '@/lib/utils/direct-import-client'
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
  const [isExternalDragActive, setIsExternalDragActive] = useState(false)
  const [isDirectImporting, setIsDirectImporting] = useState(false)
  const dragDepthRef = useRef(0)

  const iconState = useIcons({ initialIcons, collectionId })
  const { register } = useDndMove()
  const { removeIcons } = iconState
  const importCollectionId = resolveImportCollectionId(collectionId)
  const dropOverlayLabel = buildDropOverlayLabel(title)

  useEffect(() => {
    register(async (iconIds, targetCollectionId) => {
      removeIcons(iconIds)
      await moveIcons(iconIds, targetCollectionId)
    })
  }, [register, removeIcons])

  const detailIcon = detailIconId
    ? iconState.filteredIcons.find((i) => i.id === detailIconId) ?? null
    : null

  function resetExternalDragState() {
    dragDepthRef.current = 0
    setIsExternalDragActive(false)
  }

  async function importDroppedFiles(files: File[]) {
    if (isDirectImporting) return

    setIsDirectImporting(true)

    try {
      await runDirectImport(files, importCollectionId, iconState.addIcons)
    } finally {
      setIsDirectImporting(false)
    }
  }

  function handleContentDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasExternalFiles(event.dataTransfer?.types)) return

    event.preventDefault()
    dragDepthRef.current += 1

    if (!isDirectImporting) {
      setIsExternalDragActive(true)
    }
  }

  function handleContentDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasExternalFiles(event.dataTransfer?.types)) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'

    if (!isDirectImporting) {
      setIsExternalDragActive(true)
    }
  }

  function handleContentDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!hasExternalFiles(event.dataTransfer?.types)) return

    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)

    if (dragDepthRef.current === 0) {
      setIsExternalDragActive(false)
    }
  }

  async function handleContentDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasExternalFiles(event.dataTransfer?.types)) return

    event.preventDefault()

    const files = Array.from(event.dataTransfer.files ?? [])
    resetExternalDragState()

    if (isDirectImporting) {
      return
    }

    await importDroppedFiles(files)
  }

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
            collectionId={importCollectionId}
            onImported={iconState.addIcons}
            onOpenDialog={() => setImportOpen(true)}
          />
        ) : (
          <div
            className="relative flex-1 min-h-0"
            onDragEnter={handleContentDragEnter}
            onDragOver={handleContentDragOver}
            onDragLeave={handleContentDragLeave}
            onDrop={handleContentDrop}
          >
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

            {(isExternalDragActive || isDirectImporting) && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div
                  className={cn(
                    'flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-12 py-10 shadow-sm transition-colors',
                    isExternalDragActive ? 'border-primary bg-primary/5' : 'border-border bg-background/90'
                  )}
                >
                  {isDirectImporting ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}

                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium">
                      {isDirectImporting ? 'Importing…' : dropOverlayLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">{ACCEPTED_EXTENSIONS_LABEL}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
        defaultCollectionId={importCollectionId}
        onImported={iconState.addIcons}
      />
    </div>
  )
}
