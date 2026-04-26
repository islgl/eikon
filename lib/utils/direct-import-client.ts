import { toast } from 'sonner'
import { importIcons } from '@/actions/import'
import {
  isAcceptedImageFile,
  isSvgFile,
  isIcnsFile,
  icnsFileToSvgContent,
  rasterFileToSvgContent,
} from '@/lib/utils/image'
import {
  importFilesDirectly,
  notifyDirectImportOutcome,
  resolveImportCollectionId,
} from '@/lib/utils/direct-import'
import { sanitizeSvg, extractSvgName } from '@/lib/utils/svg'
import type { Icon } from '@/types'

export async function runDirectImport(
  files: File[],
  collectionId: string | null,
  onImported: (icons: Icon[]) => void
) {
  const outcome = await importFilesDirectly<Icon>({
    files,
    collectionId: resolveImportCollectionId(collectionId),
    isSupportedFile: isAcceptedImageFile,
    isSvgFile,
    isIcnsFile,
    convertSvgFile: async (file) => sanitizeSvg(await file.text()),
    convertIcnsFile: icnsFileToSvgContent,
    convertRasterFile: rasterFileToSvgContent,
    extractName: extractSvgName,
    importItems: importIcons,
  })

  notifyDirectImportOutcome(outcome, { onImported, toastApi: toast })
  return outcome
}
