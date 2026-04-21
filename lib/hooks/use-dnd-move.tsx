'use client'

import { createContext, useContext, useRef, useCallback } from 'react'

type MoveHandler = (iconIds: string[], collectionId: string | null) => void

type DndMoveContextValue = {
  register: (fn: MoveHandler) => void
  move: (iconIds: string[], collectionId: string | null) => void
}

const DndMoveContext = createContext<DndMoveContextValue>({ register: () => {}, move: () => {} })

export function DndMoveProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<MoveHandler | null>(null)
  const register = useCallback((fn: MoveHandler) => { handlerRef.current = fn }, [])
  const move = useCallback((iconIds: string[], collectionId: string | null) => {
    handlerRef.current?.(iconIds, collectionId)
  }, [])
  return <DndMoveContext.Provider value={{ register, move }}>{children}</DndMoveContext.Provider>
}

export function useDndMove() {
  return useContext(DndMoveContext)
}
