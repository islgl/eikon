'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import type { Tag } from '@/types'
import {
  Library,
  Heart,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Hash,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { CollectionTree } from './collection-tree'
import { createClient } from '@/lib/supabase/client'
import { createCollection } from '@/actions/collections'
import { useCollections } from '@/lib/hooks/use-collections'

type SidebarProps = {
  open: boolean
  onToggle: () => void
  collectionState: ReturnType<typeof useCollections>
  tags: Tag[]
  user: User
  onOpenCommand: () => void
}

export function Sidebar({ open, onToggle, collectionState, tags, user, onOpenCommand }: SidebarProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  async function handleNewCollection() {
    try {
      const c = await createCollection({ name: 'Untitled', emoji: '📁' })
      collectionState.addCollection(c)
    } catch {
      toast.error('Failed to create collection')
    }
  }

  return (
    <motion.aside
      animate={{ width: open ? 240 : 52 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col h-full border-r border-border bg-sidebar shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0"
            >
              <span className="text-sm font-semibold tracking-tight truncate block">Eikon</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <nav className="px-1.5 py-2 space-y-0.5">
          {/* Search */}
          <SidebarItem
            icon={<Search className="h-4 w-4" />}
            label="Search"
            open={open}
            shortcut="⌘K"
            onClick={onOpenCommand}
          />

          {/* Main nav */}
          <SidebarLink
            icon={<Library className="h-4 w-4" />}
            label="All Icons"
            href="/library"
            active={pathname === '/library'}
            open={open}
          />
          <SidebarLink
            icon={<Heart className="h-4 w-4" />}
            label="Favorites"
            href="/favorites"
            active={pathname === '/favorites'}
            open={open}
          />

          <Separator className="my-1.5" />

          {/* Collections */}
          <div className="flex items-center h-7 px-1.5">
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Collections
                </motion.span>
              )}
            </AnimatePresence>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewCollection}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <Plus className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="right">New collection</TooltipContent>
            </Tooltip>
          </div>

          <CollectionTree
            tree={collectionState.tree}
            expandedIds={collectionState.expandedIds}
            onToggleExpand={collectionState.toggleExpanded}
            onUpdateCollection={collectionState.updateCollection}
            onRemoveCollection={collectionState.removeCollection}
            sidebarOpen={open}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <>
              <Separator className="my-1.5" />
              <div className="flex items-center h-7 px-1.5">
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Tags
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {tags.map((tag) => (
                <SidebarItem
                  key={tag.id}
                  icon={<Hash className="h-4 w-4" style={{ color: tag.color }} />}
                  label={tag.name}
                  open={open}
                />
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="px-1.5 py-2 space-y-0.5 shrink-0">
        <SidebarItem
          icon={resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          label={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          open={open}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        />
        <SidebarItem
          icon={<LogOut className="h-4 w-4" />}
          label="Sign out"
          open={open}
          onClick={handleSignOut}
        />
        {open && (
          <div className="px-2 py-1">
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
      </div>
    </motion.aside>
  )
}

function SidebarLink({
  icon,
  label,
  href,
  active,
  open,
}: {
  icon: React.ReactNode
  label: string
  href: string
  active: boolean
  open: boolean
}) {
  const linkClass = cn(
    'flex items-center gap-2 h-7 px-1.5 rounded-md text-sm transition-colors',
    active
      ? 'bg-accent text-accent-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
  )

  return (
    <Tooltip>
      <TooltipTrigger render={<Link href={href} className={linkClass} />}>
        <span className="shrink-0">{icon}</span>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="truncate"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </TooltipTrigger>
      {!open && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}

function SidebarItem({
  icon,
  label,
  open,
  onClick,
  shortcut,
}: {
  icon: React.ReactNode
  label: string
  open: boolean
  onClick?: () => void
  shortcut?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={onClick}
            className="w-full flex items-center gap-2 h-7 px-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors text-left"
          />
        }
      >
        <span className="shrink-0">{icon}</span>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 truncate"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {open && shortcut && (
          <span className="text-[10px] text-muted-foreground/60 shrink-0">{shortcut}</span>
        )}
      </TooltipTrigger>
      {!open && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}
