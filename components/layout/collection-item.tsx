'use client'

import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Collection } from '@/types'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateCollection, deleteCollection } from '@/actions/collections'

type CollectionItemProps = {
  collection: Collection
  expanded: boolean
  hasChildren: boolean
  onToggleExpand: () => void
  onUpdate: (changes: Partial<Collection>) => void
  onRemove: () => void
  sidebarOpen: boolean
  depth: number
  autoEdit?: boolean
  onAutoEditDone?: () => void
}

export function CollectionItem({
  collection,
  expanded,
  hasChildren,
  onToggleExpand,
  onUpdate,
  onRemove,
  sidebarOpen,
  depth,
  autoEdit,
  onAutoEditDone,
}: CollectionItemProps) {
  const pathname = usePathname()
  const [editing, setEditing] = useState(false)
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `collection:${collection.id}` })
  const [name, setName] = useState(collection.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoEdit && sidebarOpen) {
      setEditing(true)
      onAutoEditDone?.()
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [autoEdit, sidebarOpen, onAutoEditDone])
  const isActive = pathname === `/library/${collection.id}`

  const itemClass = cn(
    'group relative flex items-center h-7 px-1.5 rounded-md text-sm transition-colors',
    isActive
      ? 'bg-accent text-accent-foreground'
      : isOver
        ? 'bg-primary/15 text-foreground ring-1 ring-primary/40'
        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
  )

  async function handleRename() {
    if (!name.trim() || name === collection.name) {
      setEditing(false)
      setName(collection.name)
      return
    }
    try {
      await updateCollection(collection.id, { name: name.trim() })
      onUpdate({ name: name.trim() })
    } catch {
      toast.error('Failed to rename')
      setName(collection.name)
    }
    setEditing(false)
  }

  async function handleDelete() {
    try {
      await deleteCollection(collection.id)
      onRemove()
      toast.success('Collection deleted')
    } catch {
      toast.error('Failed to delete collection')
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<div ref={setDropRef} className={itemClass} />}>
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="shrink-0 h-4 w-4 flex items-center justify-center"
          >
            <ChevronRight
              className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="shrink-0 h-4 w-4" />
        )}

        {/* Emoji + name */}
        <Link
          href={`/library/${collection.id}`}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <span className="text-sm leading-none shrink-0">
            {collection.emoji ?? <Folder className="h-3.5 w-3.5" />}
          </span>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                {editing ? (
                  <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') {
                        setEditing(false)
                        setName(collection.name)
                      }
                      e.stopPropagation()
                    }}
                    autoFocus
                    className="w-full bg-transparent text-sm outline-none border-none p-0"
                    onClick={(e) => e.preventDefault()}
                  />
                ) : (
                  <span className="truncate block">{collection.name}</span>
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Actions menu */}
        {sidebarOpen && !editing && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="opacity-0 group-hover:opacity-100 shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-opacity"
                  onClick={(e) => e.preventDefault()}
                />
              }
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => {
                  setEditing(true)
                  setTimeout(() => inputRef.current?.select(), 10)
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TooltipTrigger>
      {!sidebarOpen && (
        <TooltipContent side="right">
          {collection.emoji} {collection.name}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
