'use client'

import { useCallback } from 'react'
import type { Collection } from '@/types'
import { CollectionItem } from './collection-item'

type CollectionTreeProps = {
  tree: Collection[]
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onUpdateCollection: (id: string, changes: Partial<Collection>) => void
  onRemoveCollection: (id: string) => void
  sidebarOpen: boolean
  editingId: string | null
  onClearEditingId: () => void
  depth?: number
}

export function CollectionTree({
  tree,
  expandedIds,
  onToggleExpand,
  onUpdateCollection,
  onRemoveCollection,
  sidebarOpen,
  editingId,
  onClearEditingId,
  depth = 0,
}: CollectionTreeProps) {
  return (
    <div className={depth > 0 ? 'ml-3 border-l border-border/50' : ''}>
      {tree.map((collection) => (
        <div key={collection.id}>
          <CollectionItem
            collection={collection}
            expanded={expandedIds.has(collection.id)}
            hasChildren={(collection.children?.length ?? 0) > 0}
            onToggleExpand={() => onToggleExpand(collection.id)}
            onUpdate={(changes) => onUpdateCollection(collection.id, changes)}
            onRemove={() => onRemoveCollection(collection.id)}
            sidebarOpen={sidebarOpen}
            depth={depth}
            autoEdit={editingId === collection.id}
            onAutoEditDone={onClearEditingId}
          />
          {expandedIds.has(collection.id) && collection.children && collection.children.length > 0 && (
            <CollectionTree
              tree={collection.children}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onUpdateCollection={onUpdateCollection}
              onRemoveCollection={onRemoveCollection}
              sidebarOpen={sidebarOpen}
              editingId={editingId}
              onClearEditingId={onClearEditingId}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}
