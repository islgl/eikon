'use client'

import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Icon, ViewMode } from '@/types'
import { useContainerSize } from '@/lib/hooks/use-container-size'
import { IconCard } from './icon-card'
import { IconListRow } from './icon-list-row'

const GRID_GAP = 6
const LIST_ROW_HEIGHT = 44

type IconGridProps = {
  icons: Icon[]
  iconSize: number
  viewMode: ViewMode
  selectedIds: Set<string>
  activeIconId: string | null
  onSelect: (id: string, multi?: boolean) => void
  onOpenDetail: (id: string) => void
  onUpdateIcon: (id: string, changes: Partial<Icon>) => void
  onRemoveIcons: (ids: string[]) => void
}

export function IconGrid({
  icons,
  iconSize,
  viewMode,
  selectedIds,
  activeIconId,
  onSelect,
  onOpenDetail,
  onUpdateIcon,
  onRemoveIcons,
}: IconGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { width } = useContainerSize(parentRef)

  const cardSize = iconSize + 24 // icon + padding

  // Grid mode: chunk icons into rows
  const cols = Math.max(1, Math.floor((width + GRID_GAP) / (cardSize + GRID_GAP)))
  const gridRows = useMemo(() => {
    const rows: Icon[][] = []
    for (let i = 0; i < icons.length; i += cols) {
      rows.push(icons.slice(i, i + cols))
    }
    return rows
  }, [icons, cols])

  const rowHeight = viewMode === 'grid' ? cardSize + 24 : LIST_ROW_HEIGHT // card + name label

  const virtualizer = useVirtualizer({
    count: viewMode === 'grid' ? gridRows.length : icons.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + GRID_GAP,
    overscan: 4,
  })

  if (icons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No icons found
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-auto min-h-0"
      style={{ contain: 'strict' }}
    >
      <div
        style={{ height: virtualizer.getTotalSize() + 16, position: 'relative' }}
        className="px-4 py-3"
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          if (viewMode === 'list') {
            const icon = icons[virtualRow.index]
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: virtualRow.start,
                  left: 16,
                  right: 16,
                  height: LIST_ROW_HEIGHT,
                }}
              >
                <IconListRow
                  icon={icon}
                  selected={selectedIds.has(icon.id)}
                  active={activeIconId === icon.id}
                  onSelect={(multi) => onSelect(icon.id, multi)}
                  onOpenDetail={() => onOpenDetail(icon.id)}
                  onUpdate={(changes) => onUpdateIcon(icon.id, changes)}
                  onRemove={() => onRemoveIcons([icon.id])}
                />
              </div>
            )
          }

          const row = gridRows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                left: 16,
                right: 16,
                height: rowHeight,
                display: 'flex',
                gap: GRID_GAP,
              }}
            >
              {row.map((icon) => (
                <IconCard
                  key={icon.id}
                  icon={icon}
                  size={iconSize}
                  selected={selectedIds.has(icon.id)}
                  active={activeIconId === icon.id}
                  onSelect={(multi) => onSelect(icon.id, multi)}
                  onOpenDetail={() => onOpenDetail(icon.id)}
                  onUpdate={(changes) => onUpdateIcon(icon.id, changes)}
                  onRemove={() => onRemoveIcons([icon.id])}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
