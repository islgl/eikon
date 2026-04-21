'use client'

import { useState } from 'react'
import { Copy, Heart, Trash2, Info, Download, Link } from 'lucide-react'
import { toast } from 'sonner'
import type { Icon } from '@/types'
import { cn } from '@/lib/utils'
import { copyToClipboard, downloadSvg, downloadPng } from '@/lib/utils/copy'
import { isRasterWrappedSvg } from '@/lib/utils/svg'
import { toggleFavorite, deleteIcons, getIconSignedUrl } from '@/actions/icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

type IconCardProps = {
  icon: Icon
  size: number
  selected: boolean
  active: boolean
  onSelect: (multi?: boolean) => void
  onOpenDetail: () => void
  onUpdate: (changes: Partial<Icon>) => void
  onRemove: () => void
}

export function IconCard({ icon, size, selected, active, onSelect, onOpenDetail, onUpdate, onRemove }: IconCardProps) {
  const [hovered, setHovered] = useState(false)
  const cardSize = size + 48
  const isRaster = isRasterWrappedSvg(icon.svg_content)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await copyToClipboard(icon.svg_content)
    if (ok) toast.success(`Copied "${icon.name}"`)
    else toast.error('Copy failed')
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !icon.is_favorite
    onUpdate({ is_favorite: next })
    await toggleFavorite(icon.id, next).catch(() => {
      onUpdate({ is_favorite: icon.is_favorite })
      toast.error('Failed to update favorite')
    })
  }

  async function handleDelete() {
    await deleteIcons([icon.id])
    onRemove()
    toast.success(`Deleted "${icon.name}"`)
  }

  async function handleCopyUrl() {
    try {
      const url = await getIconSignedUrl(icon.id)
      const ok = await copyToClipboard(url)
      if (ok) toast.success('URL copied (valid 7 days)')
      else toast.error('Copy failed')
    } catch {
      toast.error('Failed to generate URL')
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={cn(
          'relative flex flex-col items-center rounded-md cursor-pointer group border transition-all duration-150 shrink-0 overflow-hidden',
          selected
            ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
            : active
              ? 'border-border bg-accent'
              : 'border-transparent bg-transparent hover:border-border hover:bg-accent/50'
        )}
        style={{ width: cardSize, height: cardSize }}
        onClick={(e) => onSelect(e.metaKey || e.ctrlKey || e.shiftKey)}
        onDoubleClick={onOpenDetail}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Top zone — reserves space so action buttons don't overlap icon */}
        <div className="h-6 w-full shrink-0" />

        {/* SVG preview — centered in remaining space */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div
            style={{ width: size, height: size }}
            className="icon-preview text-foreground"
            dangerouslySetInnerHTML={{ __html: icon.svg_content }}
          />
        </div>

        {/* Name label */}
        <div className="w-full px-1.5 pt-1 pb-2 text-center shrink-0">
          <span className="text-[10px] text-muted-foreground truncate block leading-none">
            {icon.name}
          </span>
        </div>

        {/* Action buttons */}
        <div
          className={cn(
            'absolute top-1 right-1 flex items-center gap-0.5 transition-opacity',
            hovered || active ? 'opacity-100' : 'opacity-0'
          )}
        >
          {!isRaster && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={handleCopy}
                    className="h-5 w-5 flex items-center justify-center rounded bg-background/90 hover:bg-background border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                  />
                }
              >
                <Copy className="h-2.5 w-2.5" />
              </TooltipTrigger>
              <TooltipContent>Copy SVG</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={handleFavorite}
                  className={cn(
                    'h-5 w-5 flex items-center justify-center rounded bg-background/90 hover:bg-background border border-border/50 transition-colors',
                    icon.is_favorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'
                  )}
                />
              }
            >
              <Heart className={cn('h-2.5 w-2.5', icon.is_favorite && 'fill-current')} />
            </TooltipTrigger>
            <TooltipContent>{icon.is_favorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
          </Tooltip>
        </div>

        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-1 left-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
          </div>
        )}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        {!isRaster && (
          <ContextMenuItem onClick={() => copyToClipboard(icon.svg_content).then(() => toast.success('Copied SVG'))}>
            <Copy className="h-3.5 w-3.5 mr-2" /> Copy SVG
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={handleCopyUrl}>
          <Link className="h-3.5 w-3.5 mr-2" /> Copy URL
        </ContextMenuItem>
        <ContextMenuSeparator />
        {!isRaster && (
          <ContextMenuItem onClick={() => downloadSvg(icon.svg_content, icon.name)}>
            <Download className="h-3.5 w-3.5 mr-2" /> Download SVG
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => downloadPng(icon.svg_content, icon.name, 64)}>
          <Download className="h-3.5 w-3.5 mr-2" /> Download PNG (64px)
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onOpenDetail}>
          <Info className="h-3.5 w-3.5 mr-2" /> View details
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
