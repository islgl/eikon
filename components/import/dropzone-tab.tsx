'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { extractSvgName } from '@/lib/utils/svg'
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_EXTENSIONS_LABEL } from '@/lib/utils/image'
import { runDirectImport } from '@/lib/utils/direct-import-client'
import type { Icon } from '@/types'

type DropzoneTabProps = {
  collectionId: string | null
  onImported: (icons: Icon[]) => void
}

type FileEntry = {
  file: File
  name: string
}

export function DropzoneTab({ collectionId, onImported }: DropzoneTabProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) {
      toast.error('No supported files found')
      return
    }

    setFiles(accepted.map((file) => ({
      file,
      name: extractSvgName(file.name),
    })))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    multiple: true,
  })

  async function handleImport() {
    if (files.length === 0) return

    setLoading(true)
    try {
      await runDirectImport(files.map((entry) => entry.file), collectionId, onImported)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-border/80 hover:bg-muted/30'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          {isDragActive ? 'Drop files here' : 'Drag & drop icon files'}
        </p>
        <p className="text-xs text-muted-foreground">{ACCEPTED_EXTENSIONS_LABEL} · or click to browse</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="max-h-48 overflow-y-auto space-y-1">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{file.name}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} ready
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFiles([])}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleImport}
                disabled={loading || files.length === 0}
              >
                {loading && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                Import {files.length} icons
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
