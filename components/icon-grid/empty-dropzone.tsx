'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_EXTENSIONS_LABEL } from '@/lib/utils/image'
import { runDirectImport } from '@/lib/utils/direct-import-client'
import type { Icon } from '@/types'

type EmptyDropzoneProps = {
  collectionId: string | null
  onImported: (icons: Icon[]) => void
  onOpenDialog: () => void
}

export function EmptyDropzone({ collectionId, onImported, onOpenDialog }: EmptyDropzoneProps) {
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    setLoading(true)
    try {
      await runDirectImport(accepted, collectionId, onImported)
    } finally {
      setLoading(false)
    }
  }, [collectionId, onImported])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    multiple: true,
    disabled: loading,
    noClick: true,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex-1 flex flex-col items-center justify-center transition-colors select-none outline-none',
        isDragActive && 'bg-primary/5'
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-16 py-14 transition-colors',
          isDragActive ? 'border-primary' : 'border-border'
        )}
      >
        {loading ? (
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        ) : (
          <Upload className={cn('h-8 w-8 transition-colors', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
        )}

        <div className="text-center space-y-1">
          <p className="text-sm font-medium">
            {isDragActive ? 'Drop files here' : loading ? 'Importing…' : 'Drop icon files to import'}
          </p>
          <p className="text-xs text-muted-foreground">{ACCEPTED_EXTENSIONS_LABEL}</p>
        </div>

        {!loading && !isDragActive && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={open}>
              Browse files
            </Button>
            <span className="text-xs text-muted-foreground">or</span>
            <Button size="sm" variant="ghost" onClick={onOpenDialog}>
              Paste / URL
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
