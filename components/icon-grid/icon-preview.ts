'use client'

import { createElement, useMemo, type ImgHTMLAttributes } from 'react'

function normalizePreviewSvg(svgContent: string): string {
  let svg = svgContent
    .replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '')
    .replace(/<!DOCTYPE[\s\S]*?>\s*/gi, '')
    .trim()

  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  return svg
}

function buildIconPreviewSrc(iconId: string, updatedAt?: string | null): string {
  const params = new URLSearchParams()
  if (updatedAt) {
    params.set('v', updatedAt)
  }

  const query = params.toString()
  return query.length > 0
    ? `/api/icon-preview/${encodeURIComponent(iconId)}?${query}`
    : `/api/icon-preview/${encodeURIComponent(iconId)}`
}

function svgToPreviewDataUri(svgContent: string): string {
  const normalized = normalizePreviewSvg(svgContent)
  const base64 = btoa(unescape(encodeURIComponent(normalized)))
  return `data:image/svg+xml;base64,${base64}`
}

type IconPreviewProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  iconId?: string
  updatedAt?: string | null
  svgContent?: string
  decorative?: boolean
}

export function IconPreview({
  iconId,
  updatedAt,
  svgContent,
  alt = 'Icon preview',
  className,
  decorative = true,
  ...props
}: IconPreviewProps) {
  const src = useMemo(() => {
    if (iconId) {
      return buildIconPreviewSrc(iconId, updatedAt)
    }

    if (svgContent) {
      return svgToPreviewDataUri(svgContent)
    }

    throw new Error('IconPreview requires iconId or svgContent')
  }, [iconId, svgContent, updatedAt])
  const classes = ['icon-preview', className].filter(Boolean).join(' ')

  return createElement('img', {
    src,
    alt: decorative ? '' : alt,
    'aria-hidden': decorative ? true : undefined,
    className: classes || undefined,
    decoding: 'async',
    draggable: false,
    ...props,
  })
}
