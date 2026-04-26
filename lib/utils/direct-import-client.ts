import { toast } from 'sonner'
import { isAcceptedImageFile } from '@/lib/utils/image'
import {
  notifyDirectImportOutcome,
  resolveImportCollectionId,
} from '@/lib/utils/direct-import'
import type { Icon } from '@/types'

export async function runDirectImport(
  files: File[],
  collectionId: string | null,
  onImported: (icons: Icon[]) => void
) {
  const supportedFiles = files.filter((file) => isAcceptedImageFile(file))

  const outcome = supportedFiles.length === 0
    ? { status: 'empty' as const }
    : await (async () => {
        try {
          const formData = new FormData()
          const normalizedCollectionId = resolveImportCollectionId(collectionId)

          if (normalizedCollectionId) {
            formData.append('collectionId', normalizedCollectionId)
          }

          for (const file of supportedFiles) {
            formData.append('files', file)
          }

          const response = await fetch('/api/import/files', {
            method: 'POST',
            body: formData,
          })

          const payload = await response.json().catch(() => null)

          if (!response.ok) {
            return {
              status: 'error' as const,
              error: typeof payload?.error === 'string' ? payload.error : 'Import failed',
            }
          }

          return {
            status: 'success' as const,
            result: {
              imported: Number(payload?.imported ?? 0),
              skipped: Number(payload?.skipped ?? 0),
              errors: Array.isArray(payload?.errors) ? payload.errors : [],
              icons: Array.isArray(payload?.icons) ? payload.icons as Icon[] : [],
            },
          }
        } catch (error) {
          return {
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Import failed',
          }
        }
      })()

  notifyDirectImportOutcome(outcome, { onImported, toastApi: toast })
  return outcome
}
