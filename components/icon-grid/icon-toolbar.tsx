'use client'

import { Upload, LayoutGrid, List, SortAsc, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ViewMode, SortOrder } from '@/types'

type IconToolbarProps = {
  title: string
  query: string
  onQueryChange: (q: string) => void
  iconSize: number
  onIconSizeChange: (n: number) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  sortOrder: SortOrder
  onSortOrderChange: (s: SortOrder) => void
  totalCount: number
  selectedCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onDeleteSelected: () => void
  onImport: () => void
  collectionId: string | null
}

export function IconToolbar({
  title,
  query,
  onQueryChange,
  iconSize,
  onIconSizeChange,
  viewMode,
  onViewModeChange,
  sortOrder,
  onSortOrderChange,
  totalCount,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onImport,
}: IconToolbarProps) {
  return (
    <div className="shrink-0 border-b border-border">
      {/* Title + main actions */}
      <div className="flex items-center gap-3 px-4 h-12">
        <h1 className="text-sm font-semibold shrink-0">{title}</h1>
        <span className="text-xs text-muted-foreground shrink-0">
          {totalCount} icon{totalCount !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        <Button onClick={onImport} size="sm" className="h-7 text-xs gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Import
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 pb-2.5">
        <Input
          placeholder="Search icons…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-7 text-sm max-w-56 flex-1"
        />

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Sort" />
            }
          >
            <SortAsc className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup
              value={sortOrder}
              onValueChange={(v) => onSortOrderChange(v as SortOrder)}
            >
              <DropdownMenuRadioItem value="date-desc">Newest first</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date-asc">Oldest first</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-asc">Name A–Z</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">Name Z–A</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => onViewModeChange('grid')}
                  className="h-7 w-7"
                />
              }
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Grid view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => onViewModeChange('list')}
                  className="h-7 w-7"
                />
              }
            >
              <List className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
          </Tooltip>
        </div>

        {/* Size slider (grid mode only) */}
        {viewMode === 'grid' && (
          <>
            <Separator orientation="vertical" className="h-5 mx-0.5" />
            <div className="flex items-center gap-2 w-28">
              <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-right">
                {iconSize}
              </span>
              <Slider
                value={[iconSize]}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? v[0] : (v as number)
                  if (typeof val === 'number') onIconSizeChange(val)
                }}
                min={32}
                max={128}
                step={8}
                className="flex-1"
              />
            </div>
          </>
        )}

        {/* Bulk actions */}
        {selectedCount > 0 && (
          <>
            <Separator orientation="vertical" className="h-5 mx-0.5" />
            <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground"
              onClick={onClearSelection}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
