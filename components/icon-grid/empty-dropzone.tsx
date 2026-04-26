'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { sanitizeSvg, extractSvgName } from '@/lib/utils/svg'
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_EXTENSIONS_LABEL, isSvgFile, isIcnsFile, icnsFileToSvgContent, rasterFileToSvgContent } from '@/lib/utils/image'
import { importIcons } from '@/actions/import'
import type { Icon, ImportItem } from '@/types'

type EmptyDropzoneProps = {
  collectionId: string | null
  onImported: (icons: Icon[]) => void
  onOpenDialog: () => void
}

export function EmptyDropzone({ collectionId, onImported, onOpenDialog }: EmptyDropzoneProps) {
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) {
      toast.error('No supported files found')
      return
    }

    setLoading(true)
    try {
      const items: ImportItem[] = await Promise.all(
        accepted.map(async (file): Promise<ImportItem> => ({
          name: extractSvgName(file.name),
          svgContent: isSvgFile(file)
            ? sanitizeSvg(await file.text())
            : isIcnsFile(file)
              ? await icnsFileToSvgContent(file)
              : await rasterFileToSvgContent(file),
          collectionId,
          source: 'upload' as const,
        }))
      )

      const result = await importIcons(items)
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} icon${result.imported > 1 ? 's' : ''}`)
        onImported(result.icons)
      }
      if (result.skipped > 0) toast.info(`Skipped ${result.skipped} duplicate${result.skipped > 1 ? 's' : ''}`)
      if (result.errors.length > 0) toast.error(`${result.errors.length} failed`)
    } catch {
      toast.error('Import failed')
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
