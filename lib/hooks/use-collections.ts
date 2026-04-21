'use client'

import { useState, useCallback, useMemo } from 'react'
import type { Collection } from '@/types'

export function buildCollectionTree(flat: Collection[]): Collection[] {
  const map = new Map<string, Collection>()
  const roots: Collection[] = []

  flat.forEach((c) => map.set(c.id, { ...c, children: [] }))
  flat.forEach((c) => {
    const node = map.get(c.id)!
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortTree = (nodes: Collection[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    nodes.forEach((n) => n.children && sortTree(n.children))
  }
  sortTree(roots)

  return roots
}

export function useCollections(initialCollections: Collection[]) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)

  const tree = useMemo(() => buildCollectionTree(collections), [collections])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const addCollection = useCallback((c: Collection) => {
    setCollections((prev) => [...prev, c])
    setEditingId(c.id)
  }, [])

  const updateCollection = useCallback((id: string, changes: Partial<Collection>) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)))
  }, [])

  const removeCollection = useCallback((id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return {
    collections,
    tree,
    expandedIds,
    toggleExpanded,
    addCollection,
    updateCollection,
    removeCollection,
    editingId,
    clearEditingId: () => setEditingId(null),
  }
}
