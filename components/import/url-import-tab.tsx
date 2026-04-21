'use client'

import { useState } from 'react'
import { Loader2, Link } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { importFromUrl } from '@/actions/import'
import type { Icon } from '@/types'

type UrlImportTabProps = {
  collectionId: string | null
  onImported: (icons: Icon[]) => void
}

export function UrlImportTab({ collectionId, onImported }: UrlImportTabProps) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  function inferNameFromUrl(u: string) {
    try {
      const path = new URL(u).pathname
      const filename = path.split('/').pop() ?? ''
      return filename.replace(/\.(svg|png|jpe?g|webp|gif|ico)$/i, '').replace(/[-_]/g, ' ').trim()
    } catch {
      return ''
    }
  }

  function handleUrlChange(value: string) {
    setUrl(value)
    if (!name) setName(inferNameFromUrl(value))
  }

  async function handleImport() {
    if (!url.trim() || !name.trim()) return
    setLoading(true)
    const result = await importFromUrl(url.trim(), name.trim(), collectionId)
    setLoading(false)

    if (result.success) {
      toast.success(`Imported "${name}"`)
      onImported(result.icons ?? [])
    } else {
      toast.error(result.error ?? 'Import failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Image URL</Label>
          <Input
            type="url"
            placeholder="https://example.com/icon.svg"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="h-8 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Supports SVG, PNG, JPG, WebP, GIF, ICO
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Icon name</Label>
          <Input
            placeholder="e.g. my-icon"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <Button
        className="w-full h-8 text-sm"
        onClick={handleImport}
        disabled={loading || !url.trim() || !name.trim()}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Link className="h-3.5 w-3.5 mr-1.5" />
        )}
        Import from URL
      </Button>
    </div>
  )
}
