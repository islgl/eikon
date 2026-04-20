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
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const { supabase, user } = await getUser()

  let imported = 0
  let skipped = 0
  const errors: string[] = []

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

      // Insert metadata
      const { error: dbError } = await supabase.from('icons').insert({
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

      if (dbError) {
        await supabase.storage.from('icons').remove([storagePath])
        errors.push(`${item.name}: ${dbError.message}`)
        continue
      }

      imported++
    } catch (err) {
      errors.push(`${item.name}: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  if (imported > 0) revalidatePath('/', 'layout')
  return { imported, skipped, errors }
}

export async function importFromUrl(
  url: string,
  name: string,
  collectionId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch SVG from URL (server-side, avoids CORS)
    const response = await fetch(url, {
      headers: { Accept: 'image/svg+xml,text/plain,*/*' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const contentType = response.headers.get('content-type') ?? ''
    const text = await response.text()

    if (!text.trim().includes('<svg')) {
      return { success: false, error: 'URL does not contain SVG content' }
    }

    const result = await importIcons([
      {
        name,
        svgContent: text,
        collectionId: collectionId ?? null,
        sourceUrl: url,
        source: 'url',
      },
    ])

    if (result.errors.length > 0) {
      return { success: false, error: result.errors[0] }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch URL' }
  }
}
