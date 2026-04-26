'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import Fuse from 'fuse.js'
import { getIcons } from '@/actions/icons'
import type { Icon, SortOrder } from '@/types'

type UseIconsOptions = {
  initialIcons: Icon[]
  initialHasMore: boolean
  collectionId?: string | null
}

export function useIcons({ initialIcons, initialHasMore, collectionId }: UseIconsOptions) {
  const [icons, setIcons] = useState<Icon[]>(initialIcons)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const offsetRef = useRef(initialIcons.length)

  const fuse = useMemo(
    () =>
      new Fuse(icons, {
        keys: ['name', 'tags.name'],
        threshold: 0.3,
        includeScore: true,
      }),
    [icons]
  )

  const filteredIcons = useMemo(() => {
    let result = query ? fuse.search(query).map((r) => r.item) : [...icons]

    if (selectedTagIds.length > 0) {
      result = result.filter((icon) =>
        selectedTagIds.every((tid) => icon.tags?.some((t) => t.id === tid))
      )
    }

    result.sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })

    return result
  }, [icons, query, selectedTagIds, sortOrder, fuse])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const result = await getIcons(collectionId, offsetRef.current)
      setIcons((prev) => [...prev, ...result.icons])
      setHasMore(result.hasMore)
      offsetRef.current += result.icons.length
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, collectionId])

  const toggleSelect = useCallback((id: string, multi = false) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (!multi) {
        if (next.has(id) && next.size === 1) {
          next.clear()
        } else {
          next.clear()
          next.add(id)
        }
        return next
      }
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredIcons.map((i) => i.id)))
  }, [filteredIcons])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const updateIcon = useCallback((id: string, changes: Partial<Icon>) => {
    setIcons((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)))
  }, [])

  const removeIcons = useCallback((ids: string[]) => {
    setIcons((prev) => prev.filter((i) => !ids.includes(i.id)))
    offsetRef.current = Math.max(0, offsetRef.current - ids.length)
  }, [])

  const addIcons = useCallback((newIcons: Icon[]) => {
    setIcons((prev) => [...newIcons, ...prev])
    offsetRef.current += newIcons.length
  }, [])

  return {
    icons,
    filteredIcons,
    hasMore,
    isLoadingMore,
    loadMore,
    query,
    setQuery,
    selectedTagIds,
    setSelectedTagIds,
    sortOrder,
    setSortOrder,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    updateIcon,
    removeIcons,
    addIcons,
  }
}
