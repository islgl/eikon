import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { extractSvgDimensions, extractSvgName, normalizeSvg, sanitizeSvg } from '@/lib/utils/svg'
import {
  buildSvgWrapperFromRaster,
  bufferToBase64,
  compressRasterUploadIfNeeded,
  extractPreferredIcnsPng,
} from './raster-import'
import type { Icon, ImportItem } from '@/types'

type ImportResult = {
  imported: number
  skipped: number
  errors: string[]
  icons: Icon[]
}

const MIME_BY_EXTENSION: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  icns: 'image/x-icns',
}

function normalizeCollectionId(collectionId?: string | null): string | null {
  if (!collectionId || collectionId === 'favorites') return null
  return collectionId
}

function inferMimeType(fileName: string, contentType: string): string | null {
  const normalizedType = contentType.toLowerCase()

  if (normalizedType.includes('svg')) return 'image/svg+xml'
  if (normalizedType.includes('png')) return 'image/png'
  if (normalizedType.includes('jpeg') || normalizedType.includes('jpg')) return 'image/jpeg'
  if (normalizedType.includes('webp')) return 'image/webp'
  if (normalizedType.includes('gif')) return 'image/gif'
  if (normalizedType.includes('x-icon') || normalizedType.includes('vnd.microsoft.icon')) return 'image/x-icon'
  if (normalizedType.includes('icns')) return 'image/x-icns'

  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? (MIME_BY_EXTENSION[extension] ?? null) : null
}

function isSvgUpload(fileName: string, mimeType: string | null): boolean {
  return mimeType === 'image/svg+xml' || fileName.toLowerCase().endsWith('.svg')
}

function isIcnsUpload(fileName: string, mimeType: string | null): boolean {
  return mimeType === 'image/x-icns' || fileName.toLowerCase().endsWith('.icns')
}

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Unauthorized')

  return { supabase, user }
}

export async function persistImportItems(items: ImportItem[]): Promise<ImportResult> {
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
    } catch (error) {
      errors.push(`${item.name}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  if (imported > 0) {
    revalidatePath('/', 'layout')
  }

  return { imported, skipped, errors, icons }
}

async function buildUploadImportItem(file: File, collectionId: string | null): Promise<ImportItem> {
  const mimeType = inferMimeType(file.name, file.type)
  if (!mimeType) throw new Error('Unsupported file type')

  if (isSvgUpload(file.name, mimeType)) {
    return {
      name: extractSvgName(file.name),
      svgContent: sanitizeSvg(await file.text()),
      collectionId,
      source: 'upload',
    }
  }

  let rasterBuffer: Uint8Array = Buffer.from(await file.arrayBuffer())
  let rasterMimeType = mimeType
  const originalFileSize = file.size

  if (isIcnsUpload(file.name, mimeType)) {
    rasterBuffer = extractPreferredIcnsPng(rasterBuffer)
    rasterMimeType = 'image/png'
  }

  const raster = await compressRasterUploadIfNeeded({
    buffer: rasterBuffer,
    mimeType: rasterMimeType,
    fileSize: Math.max(originalFileSize, rasterBuffer.length),
  })

  return {
    name: extractSvgName(file.name),
    svgContent: buildSvgWrapperFromRaster({
      mimeType: raster.mimeType,
      base64: bufferToBase64(raster.buffer),
      width: raster.width,
      height: raster.height,
    }),
    collectionId,
    source: 'upload',
  }
}

export async function importUploadedFiles(files: File[], collectionId?: string | null): Promise<ImportResult> {
  const normalizedCollectionId = normalizeCollectionId(collectionId)
  const items: ImportItem[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      items.push(await buildUploadImportItem(file, normalizedCollectionId))
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Import failed'}`)
    }
  }

  if (items.length === 0) {
    return {
      imported: 0,
      skipped: 0,
      errors: errors.length > 0 ? errors : ['No supported files found'],
      icons: [],
    }
  }

  const result = await persistImportItems(items)
  return {
    ...result,
    errors: [...result.errors, ...errors],
  }
}

export async function importFromUrlOnServer(
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

    const mimeType = inferMimeType(url, response.headers.get('content-type') ?? '')
    if (!mimeType) {
      return { success: false, error: 'Unsupported image format. Supported: SVG, PNG, JPG, WebP, GIF, ICO, ICNS' }
    }

    let svgContent: string

    if (isSvgUpload(url, mimeType)) {
      const text = await response.text()
      if (!text.trim().includes('<svg')) {
        return { success: false, error: 'URL does not contain SVG content' }
      }

      svgContent = sanitizeSvg(text)
    } else {
      let rasterBuffer: Uint8Array = Buffer.from(await response.arrayBuffer())
      let rasterMimeType = mimeType

      if (isIcnsUpload(url, mimeType)) {
        rasterBuffer = extractPreferredIcnsPng(rasterBuffer)
        rasterMimeType = 'image/png'
      }

      const raster = await compressRasterUploadIfNeeded({
        buffer: rasterBuffer,
        mimeType: rasterMimeType,
        fileSize: Math.max(Number(response.headers.get('content-length') ?? 0) || 0, rasterBuffer.length),
      })

      svgContent = buildSvgWrapperFromRaster({
        mimeType: raster.mimeType,
        base64: bufferToBase64(raster.buffer),
        width: raster.width,
        height: raster.height,
      })
    }

    const result = await persistImportItems([{
      name,
      svgContent,
      collectionId: normalizeCollectionId(collectionId),
      sourceUrl: url,
      source: 'url',
    }])

    if (result.errors.length > 0) {
      return { success: false, error: result.errors[0] }
    }

    return { success: true, icons: result.icons }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch URL' }
  }
}
