'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSvg, normalizeSvg, extractSvgDimensions } from '@/lib/utils/svg'
import type { Icon, ImportItem } from '@/types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function importIcons(
  items: ImportItem[]
): Promise<{ imported: number; skipped: number; errors: string[]; icons: Icon[] }> {
  const { supabase, user } = await getUser()

  let imported = 0
  let skipped = 0
  const errors: string[] = []
  const icons: Icon[] = []

  for (const item of items) {
    try {
      const sanitized = sanitizeSvg(item.svgContent)
      const normalized = normalizeSvg(sanitized)
      const { width, height } = extractSvgDimensions(normalized)

      // Check for duplicate by name within same collection
      const { data: existing } = await supabase
        .from('icons')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', item.name)
        .eq('collection_id', item.collectionId ?? null)
        .single()

      if (existing) {
        skipped++
        continue
      }

      // Upload SVG to storage
      const iconId = crypto.randomUUID()
      const storagePath = `${user.id}/${iconId}.svg`
      const blob = new Blob([normalized], { type: 'image/svg+xml' })
      const arrayBuffer = await blob.arrayBuffer()

      const { error: storageError } = await supabase.storage
        .from('icons')
        .upload(storagePath, arrayBuffer, {
          contentType: 'image/svg+xml',
          upsert: false,
        })

      if (storageError) {
        errors.push(`${item.name}: storage error`)
        continue
      }

      // Insert metadata and return the created row
      const { data: insertedIcon, error: dbError } = await supabase
        .from('icons')
        .insert({
          id: iconId,
          user_id: user.id,
          collection_id: item.collectionId ?? null,
          name: item.name,
          svg_content: normalized,
          storage_path: storagePath,
          width,
          height,
          source: item.source,
          source_url: item.sourceUrl ?? null,
          is_favorite: false,
          metadata: {},
        })
        .select()
        .single()

      if (dbError) {
        await supabase.storage.from('icons').remove([storagePath])
        errors.push(`${item.name}: ${dbError.message}`)
        continue
      }

      icons.push({ ...insertedIcon, tags: [] })
      imported++
    } catch (err) {
      errors.push(`${item.name}: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  if (imported > 0) revalidatePath('/', 'layout')
  return { imported, skipped, errors, icons }
}

function getRasterMimeType(contentType: string, url: string): string | null {
  if (contentType.includes('png')) return 'image/png'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'image/jpeg'
  if (contentType.includes('webp')) return 'image/webp'
  if (contentType.includes('gif')) return 'image/gif'
  if (contentType.includes('x-icon') || contentType.includes('vnd.microsoft.icon')) return 'image/x-icon'
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  const extMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', ico: 'image/x-icon' }
  return ext ? (extMap[ext] ?? null) : null
}

function parseRasterDimensions(buf: Uint8Array, mimeType: string): { width: number; height: number } {
  try {
    if (mimeType === 'image/png' && buf.length >= 24) {
      const w = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19]
      const h = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23]
      if (w > 0 && h > 0) return { width: w, height: h }
    }
    if (mimeType === 'image/gif' && buf.length >= 10) {
      const w = buf[6] | (buf[7] << 8)
      const h = buf[8] | (buf[9] << 8)
      if (w > 0 && h > 0) return { width: w, height: h }
    }
  } catch {}
  return { width: 64, height: 64 }
}

export async function importFromUrl(
  url: string,
  name: string,
  collectionId?: string | null
): Promise<{ success: boolean; error?: string; icons?: Icon[] }> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'image/*,text/plain,*/*' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const contentType = response.headers.get('content-type') ?? ''
    const isSvg = contentType.includes('svg') || url.split('?')[0].toLowerCase().endsWith('.svg')

    let svgContent: string

    if (isSvg) {
      const text = await response.text()
      if (!text.trim().includes('<svg')) {
        return { success: false, error: 'URL does not contain SVG content' }
      }
      svgContent = text
    } else {
      const mimeType = getRasterMimeType(contentType, url)
      if (!mimeType) {
        return { success: false, error: 'Unsupported image format. Supported: SVG, PNG, JPG, WebP, GIF, ICO' }
      }
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const dataUri = `data:${mimeType};base64,${base64}`
      const { width, height } = parseRasterDimensions(new Uint8Array(arrayBuffer), mimeType)
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image href="${dataUri}" width="${width}" height="${height}"/></svg>`
    }

    const result = await importIcons([{
      name,
      svgContent,
      collectionId: collectionId ?? null,
      sourceUrl: url,
      source: 'url',
    }])

    if (result.errors.length > 0) {
      return { success: false, error: result.errors[0] }
    }

    return { success: true, icons: result.icons }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch URL' }
  }
}
