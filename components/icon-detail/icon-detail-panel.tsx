'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, Download, Heart, Pencil, Check, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { Icon, CopyFormat } from '@/types'
import { cn } from '@/lib/utils'
import { copyToClipboard, formatIconForCopy, downloadSvg, downloadPng } from '@/lib/utils/copy'
import { applyColorToSvg } from '@/lib/utils/color'
import { updateIcon, toggleFavorite } from '@/actions/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

type IconDetailPanelProps = {
  icon: Icon
  onClose: () => void
  onUpdate: (changes: Partial<Icon>) => void
  onDelete: () => void
}

const COPY_FORMATS: { format: CopyFormat; label: string }[] = [
  { format: 'svg', label: 'SVG' },
  { format: 'jsx', label: 'JSX Component' },
  { format: 'data-uri', label: 'Data URI' },
]

const PNG_SIZES = [16, 24, 32, 48, 64, 128]

export function IconDetailPanel({ icon, onClose, onUpdate, onDelete }: IconDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(icon.name)
  const [previewColor, setPreviewColor] = useState('#000000')
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('svg')

  const previewSvg =
    previewColor !== '#000000' ? applyColorToSvg(icon.svg_content, previewColor) : icon.svg_content

  async function handleRename() {
    if (!name.trim() || name === icon.name) {
      setEditing(false)
      setName(icon.name)
      return
    }
    onUpdate({ name: name.trim() })
    await updateIcon(icon.id, { name: name.trim() }).catch(() => {
      onUpdate({ name: icon.name })
      toast.error('Failed to rename')
    })
    setEditing(false)
  }

  async function handleCopy() {
    const content = formatIconForCopy(icon.svg_content, icon.name, copyFormat)
    const ok = await copyToClipboard(content)
    if (ok) toast.success(`Copied as ${copyFormat.toUpperCase()}`)
    else toast.error('Copy failed')
  }

  async function handleFavorite() {
    const next = !icon.is_favorite
    onUpdate({ is_favorite: next })
    await toggleFavorite(icon.id, next).catch(() => onUpdate({ is_favorite: icon.is_favorite }))
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full border-l border-border bg-background shrink-0 overflow-hidden"
    >
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename()
                    if (e.key === 'Escape') {
                      setEditing(false)
                      setName(icon.name)
                    }
                  }}
                  autoFocus
                  className="h-7 text-sm font-medium"
                />
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 group text-left"
                >
                  <span className="text-sm font-medium leading-tight">{icon.name}</span>
                  <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {icon.width && icon.height ? `${icon.width}×${icon.height}` : 'SVG'}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFavorite}
                      className={cn(
                        'h-7 w-7',
                        icon.is_favorite
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-muted-foreground'
                      )}
                    />
                  }
                >
                  <Heart className={cn('h-4 w-4', icon.is_favorite && 'fill-current')} />
                </TooltipTrigger>
                <TooltipContent>{icon.is_favorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-7 w-7 text-muted-foreground"
                    />
                  }
                >
                  <X className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center h-32 rounded-lg border border-border bg-muted/20">
            <div
              className="icon-preview h-16 w-16"
              style={{ color: previewColor }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              Preview color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={previewColor}
                onChange={(e) => setPreviewColor(e.target.value)}
                className="h-7 w-7 rounded border border-border cursor-pointer bg-transparent"
              />
              <Input
                value={previewColor}
                onChange={(e) => setPreviewColor(e.target.value)}
                className="h-7 text-xs font-mono w-24"
                maxLength={7}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPreviewColor('#000000')}
              >
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* Copy */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              Copy as
            </label>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 justify-between" />
                  }
                >
                  {COPY_FORMATS.find((f) => f.format === copyFormat)?.label}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {COPY_FORMATS.map(({ format, label }) => (
                    <DropdownMenuItem key={format} onClick={() => setCopyFormat(format)}>
                      {label}
                      {copyFormat === format && <Check className="h-3 w-3 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" onClick={handleCopy} className="h-7 text-xs gap-1.5">
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>

          {/* Download */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              Download
            </label>
            <div className="space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs justify-start gap-2"
                onClick={() => downloadSvg(icon.svg_content, icon.name)}
              >
                <Download className="h-3 w-3" />
                Download SVG
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs justify-start gap-2"
                    />
                  }
                >
                  <Download className="h-3 w-3" />
                  Download PNG…
                  <ChevronDown className="h-3 w-3 ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  {PNG_SIZES.map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => downloadPng(previewSvg, icon.name, size)}
                    >
                      {size}×{size}px
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Info
            </label>
            <div className="space-y-1">
              <MetaRow label="Source" value={icon.source} />
              {icon.source_url && <MetaRow label="URL" value={icon.source_url} truncate />}
              <MetaRow label="Added" value={new Date(icon.created_at).toLocaleDateString()} />
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.aside>
  )
}

function MetaRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-[11px] text-right', truncate && 'truncate max-w-28')}>{value}</span>
    </div>
  )
}
