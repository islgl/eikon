'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileIcon, X, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { sanitizeSvg, extractSvgName } from '@/lib/utils/svg'
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_EXTENSIONS_LABEL, isSvgFile, isIcnsFile, icnsFileToSvgContent, rasterFileToSvgContent } from '@/lib/utils/image'
import { importIcons } from '@/actions/import'
import type { Icon, ImportItem } from '@/types'

// Simple progress component
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-300 rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

type DropzoneTabProps = {
  collectionId: string | null
  onImported: (icons: Icon[]) => void
}

type FileEntry = {
  name: string
  svgContent: string
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

export function DropzoneTab({ collectionId, onImported }: DropzoneTabProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) {
      toast.error('No supported files found')
      return
    }

    const entries = await Promise.all(
      accepted.map(async (file): Promise<FileEntry> => {
        try {
          const svgContent = isSvgFile(file)
            ? sanitizeSvg(await file.text())
            : isIcnsFile(file)
              ? await icnsFileToSvgContent(file)
              : await rasterFileToSvgContent(file)
          return { name: extractSvgName(file.name), svgContent, status: 'pending' }
        } catch {
          return { name: file.name, svgContent: '', status: 'error', error: 'Invalid file' }
        }
      })
    )
    setFiles(entries)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    multiple: true,
  })

  async function handleImport() {
    const valid = files.filter((f) => f.status === 'pending' && f.svgContent)
    if (valid.length === 0) return

    setLoading(true)
    setProgress(0)

    const items: ImportItem[] = valid.map((f) => ({
      name: f.name,
      svgContent: f.svgContent,
      collectionId: collectionId,
      source: 'upload' as const,
    }))

    const result = await importIcons(items)
    setLoading(false)
    setProgress(100)

    if (result.imported > 0) {
      toast.success(`Imported ${result.imported} icon${result.imported > 1 ? 's' : ''}`)
      onImported(result.icons)
    }
    if (result.skipped > 0) toast.info(`Skipped ${result.skipped} duplicate${result.skipped > 1 ? 's' : ''}`)
    if (result.errors.length > 0) toast.error(`${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`)
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
                {file.status === 'error' && (
                  <span className="text-xs text-destructive">{file.error}</span>
                )}
                {file.status === 'done' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
              </div>
            ))}
          </div>

          {loading && <ProgressBar value={progress} />}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {files.filter((f) => f.status === 'pending').length} file{files.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''} ready
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
                disabled={loading || files.filter((f) => f.status === 'pending').length === 0}
              >
                {loading && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                Import {files.filter((f) => f.status === 'pending').length} icons
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
