'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sanitizeSvg } from '@/lib/utils/svg'
import { importIcons } from '@/actions/import'
import type { Icon } from '@/types'

type PasteSvgTabProps = {
  collectionId: string | null
  onImported: (icons: Icon[]) => void
}

export function PasteSvgTab({ collectionId, onImported }: PasteSvgTabProps) {
  const [svgCode, setSvgCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState('')

  function handleSvgChange(value: string) {
    setSvgCode(value)
    try {
      const sanitized = sanitizeSvg(value)
      setPreview(sanitized)
      // Auto-extract name from title tag
      const titleMatch = value.match(/<title[^>]*>(.*?)<\/title>/i)
      if (titleMatch && !name) setName(titleMatch[1])
    } catch {
      setPreview('')
    }
  }

  async function handleImport() {
    if (!svgCode.trim() || !name.trim()) return
    setLoading(true)
    try {
      const result = await importIcons([
        {
          name: name.trim(),
          svgContent: svgCode,
          collectionId,
          source: 'paste',
        },
      ])
      if (result.imported > 0) {
        toast.success(`Imported "${name}"`)
        onImported([])
      } else if (result.skipped > 0) {
        toast.info('Icon already exists')
      } else {
        toast.error(result.errors[0] ?? 'Import failed')
      }
    } catch (err) {
      toast.error('Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Icon name</Label>
            <Input
              placeholder="e.g. arrow-right"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SVG code</Label>
            <Textarea
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">…</svg>'
              value={svgCode}
              onChange={(e) => handleSvgChange(e.target.value)}
              className="text-xs font-mono min-h-32 resize-none"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col">
          <Label className="text-xs mb-1.5">Preview</Label>
          <div className="flex-1 flex items-center justify-center rounded-lg border border-border bg-muted/30 min-h-32">
            {preview ? (
              <div
                className="icon-preview h-16 w-16 text-foreground"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            ) : (
              <span className="text-xs text-muted-foreground">Paste SVG to preview</span>
            )}
          </div>
        </div>
      </div>

      <Button
        className="w-full h-8 text-sm"
        onClick={handleImport}
        disabled={loading || !svgCode.trim() || !name.trim()}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        Import icon
      </Button>
    </div>
  )
}
