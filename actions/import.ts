'use server'

import { importFromUrlOnServer, persistImportItems } from '@/lib/server/import-files'
import type { Icon, ImportItem } from '@/types'

export async function importIcons(
  items: ImportItem[]
): Promise<{ imported: number; skipped: number; errors: string[]; icons: Icon[] }> {
  return persistImportItems(items)
}

export async function importFromUrl(
  url: string,
  name: string,
  collectionId?: string | null
): Promise<{ success: boolean; error?: string; icons?: Icon[] }> {
  return importFromUrlOnServer(url, name, collectionId)
}
