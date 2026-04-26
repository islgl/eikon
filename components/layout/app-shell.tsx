'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Collection, Tag } from '@/types'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { Sidebar } from './sidebar'
import { CommandPalette } from '@/components/command/command-palette'
import { IconPreview } from '@/components/icon-grid/icon-preview'
import { useCommandPalette } from '@/lib/hooks/use-command'
import { useCollections } from '@/lib/hooks/use-collections'
import { DndMoveProvider, useDndMove } from '@/lib/hooks/use-dnd-move'

type AppShellProps = {
  collections: Collection[]
  tags: Tag[]
  user: User
  children: React.ReactNode
}

export function AppShell(props: AppShellProps) {
  return (
    <DndMoveProvider>
      <AppShellInner {...props} />
    </DndMoveProvider>
  )
}

function AppShellInner({ collections, tags, user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeDrag, setActiveDrag] = useState<{ id: string; name: string; svgContent: string } | null>(null)
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette()
  const collectionState = useCollections(collections)
  const { move } = useDndMove()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current as { name: string; svgContent: string } | undefined
    setActiveDrag({ id: String(e.active.id), name: data?.name ?? '', svgContent: data?.svgContent ?? '' })
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDrag(null)
    if (!e.over) return
    const iconId = String(e.active.id)
    const collectionId = e.over.id === 'collection:null' ? null : String(e.over.id).replace('collection:', '')
    move([iconId], collectionId)
  }

  return (
    <DndContext sensors={sensors} modifiers={[snapCenterToCursor]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-background/90 backdrop-blur-sm shadow-2xl ring-1 ring-black/5 pointer-events-none px-3 pt-3 pb-2.5">
            <IconPreview
              svgContent={activeDrag.svgContent}
              className="text-foreground"
              style={{ width: 36, height: 36 }}
            />
            <span className="text-[10px] text-muted-foreground max-w-20 truncate leading-none">
              {activeDrag.name}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
