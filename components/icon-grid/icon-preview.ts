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

function svgToPreviewDataUri(svgContent: string): string {
  const normalized = normalizePreviewSvg(svgContent)
  const base64 = btoa(unescape(encodeURIComponent(normalized)))
  return `data:image/svg+xml;base64,${base64}`
}

type IconPreviewProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  svgContent: string
  decorative?: boolean
}

export function IconPreview({
  svgContent,
  alt = 'Icon preview',
  className,
  decorative = true,
  ...props
}: IconPreviewProps) {
  const src = useMemo(() => svgToPreviewDataUri(svgContent), [svgContent])
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
