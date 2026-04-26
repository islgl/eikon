'use client'

import type { CopyFormat } from '@/types'
import { extractSvgDimensions, normalizeSvg, svgToDataUri, svgToJsx } from './svg'

const OBJECT_URL_RELEASE_DELAY_MS = 0

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}

export function formatIconForCopy(svgContent: string, name: string, format: CopyFormat): string {
  switch (format) {
    case 'svg':
      return svgContent
    case 'jsx':
      return svgToJsx(svgContent, name)
    case 'data-uri':
      return svgToDataUri(svgContent)
    default:
      return svgContent
  }
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Let the browser claim the blob URL before cleaning it up.
  setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_RELEASE_DELAY_MS)
}

export async function downloadSvg(svgContent: string, filename: string): Promise<void> {
  const blob = new Blob([normalizeSvg(svgContent)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${filename}.svg`)
}

function resolvePngDimensions(svgContent: string, size?: number): { width: number; height: number } {
  const normalizedSvg = normalizeSvg(svgContent)
  const original = extractSvgDimensions(normalizedSvg)

  if (!size) {
    return {
      width: Math.max(1, Math.round(original.width)),
      height: Math.max(1, Math.round(original.height)),
    }
  }

  const longestEdge = Math.max(original.width, original.height)
  if (!Number.isFinite(longestEdge) || longestEdge <= 0) {
    return { width: size, height: size }
  }

  const scale = size / longestEdge
  return {
    width: Math.max(1, Math.round(original.width * scale)),
    height: Math.max(1, Math.round(original.height * scale)),
  }
}

export async function downloadPng(svgContent: string, filename: string, size?: number): Promise<void> {
  const normalizedSvg = normalizeSvg(svgContent)
  const dimensions = resolvePngDimensions(normalizedSvg, size)
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const img = new Image()
  const blob = new Blob([normalizedSvg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load SVG for PNG export'))
      img.src = url
    })

    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
  } finally {
    URL.revokeObjectURL(url)
  }

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate PNG blob'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })

  const outputName = size ? `${filename}-${size}px.png` : `${filename}.png`
  triggerDownload(URL.createObjectURL(pngBlob), outputName)
}
