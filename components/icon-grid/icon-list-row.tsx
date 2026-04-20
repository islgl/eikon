'use client'

import { Copy, Heart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Icon } from '@/types'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/utils/copy'
import { toggleFavorite, deleteIcons } from '@/actions/icons'
import { Badge } from '@/components/ui/badge'
import { getTagColor } from '@/lib/utils/color'

type IconListRowProps = {
  icon: Icon
  selected: boolean
  active: boolean
  onSelect: (multi?: boolean) => void
  onOpenDetail: () => void
  onUpdate: (changes: Partial<Icon>) => void
  onRemove: () => void
}

export function IconListRow({ icon, selected, active, onSelect, onOpenDetail, onUpdate, onRemove }: IconListRowProps) {
  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    await copyToClipboard(icon.svg_content)
    toast.success(`Copied "${icon.name}"`)
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !icon.is_favorite
    onUpdate({ is_favorite: next })
    await toggleFavorite(icon.id, next).catch(() => onUpdate({ is_favorite: icon.is_favorite }))
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    await deleteIcons([icon.id])
    onRemove()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 h-full px-2 rounded-md cursor-pointer group transition-colors',
        selected ? 'bg-primary/8' : active ? 'bg-accent' : 'hover:bg-accent/50'
      )}
      onClick={(e) => onSelect(e.metaKey || e.ctrlKey)}
      onDoubleClick={onOpenDetail}
    >
      {/* Icon preview */}
      <div
        className="icon-preview h-6 w-6 flex items-center justify-center shrink-0 text-foreground"
        dangerouslySetInnerHTML={{ __html: icon.svg_content }}
      />

      {/* Name */}
      <span className="text-sm flex-1 truncate min-w-0">{icon.name}</span>

      {/* Tags */}
      <div className="flex items-center gap-1 shrink-0">
        {icon.tags?.slice(0, 3).map((tag) => {
          const c = getTagColor(tag.color)
          return (
            <Badge
              key={tag.id}
              variant="secondary"
              className="h-4 px-1.5 text-[10px] font-medium"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              {tag.name}
            </Badge>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={handleCopy}
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={handleFavorite}
          className={cn(
            'h-6 w-6 flex items-center justify-center rounded hover:bg-muted',
            icon.is_favorite ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Heart className={cn('h-3 w-3', icon.is_favorite && 'fill-current')} />
        </button>
        <button
          onClick={handleDelete}
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
