'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Collection, Tag } from '@/types'
import { Sidebar } from './sidebar'
import { CommandPalette } from '@/components/command/command-palette'
import { useCommandPalette } from '@/lib/hooks/use-command'
import { useCollections } from '@/lib/hooks/use-collections'

type AppShellProps = {
  collections: Collection[]
  tags: Tag[]
  user: User
  children: React.ReactNode
}

export function AppShell({ collections, tags, user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette()
  const collectionState = useCollections(collections)

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        collectionState={collectionState}
        tags={tags}
        user={user}
        onOpenCommand={() => setCmdOpen(true)}
      />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        collections={collectionState.collections}
        tags={tags}
      />
    </div>
  )
}
