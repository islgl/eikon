'use client'

import type { CopyFormat } from '@/types'
import { svgToDataUri, svgToJsx } from './svg'

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
  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${filename}.svg`)
}

export async function downloadPng(svgContent: string, filename: string, size: number): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const img = new Image()
  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })

    ctx.drawImage(img, 0, 0, size, size)
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

  triggerDownload(URL.createObjectURL(pngBlob), `${filename}-${size}px.png`)
}
