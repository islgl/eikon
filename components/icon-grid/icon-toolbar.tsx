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
        <Tooltip>
          <TooltipTrigger render={
            <a
              href="https://github.com/islgl/eikon"
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer"
            />
          }>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.216.69.825.572C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </TooltipTrigger>
          <TooltipContent>GitHub</TooltipContent>
        </Tooltip>
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

        <div className="flex-1" />

        {/* Import */}
        <Button onClick={onImport} size="sm" className="h-7 text-xs gap-1.5 group cursor-pointer">
          <Upload className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
          Import
        </Button>

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
