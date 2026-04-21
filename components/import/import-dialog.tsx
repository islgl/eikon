'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Icon } from '@/types'
import { DropzoneTab } from './dropzone-tab'
import { UrlImportTab } from './url-import-tab'

type ImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCollectionId: string | null
  onImported: (icons: Icon[]) => void
}

export function ImportDialog({ open, onOpenChange, defaultCollectionId, onImported }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState('upload')

  function handleClose() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Import Icons</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 text-sm">Upload</TabsTrigger>
            <TabsTrigger value="url" className="flex-1 text-sm">From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <DropzoneTab
              collectionId={defaultCollectionId}
              onImported={(icons) => {
                onImported(icons)
                handleClose()
              }}
            />
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <UrlImportTab
              collectionId={defaultCollectionId}
              onImported={(icons) => {
                onImported(icons)
                handleClose()
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
