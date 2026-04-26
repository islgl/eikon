export type DirectImportItem = {
  name: string
  svgContent: string
  collectionId: string | null
  source: 'upload'
}

export type DirectImportResult<TIcon> = {
  imported: number
  skipped: number
  errors: string[]
  icons: TIcon[]
}

export type DirectImportOutcome<TIcon> =
  | { status: 'empty' }
  | { status: 'success'; result: DirectImportResult<TIcon> }
  | { status: 'error'; error: string }

type ImportFilesDirectlyOptions<TIcon> = {
  files: File[]
  collectionId: string | null
  isSupportedFile: (file: File) => boolean
  isSvgFile: (file: File) => boolean
  isIcnsFile: (file: File) => boolean
  convertSvgFile: (file: File) => Promise<string>
  convertIcnsFile: (file: File) => Promise<string>
  convertRasterFile: (file: File) => Promise<string>
  extractName: (filename: string) => string
  importItems: (items: DirectImportItem[]) => Promise<DirectImportResult<TIcon>>
}

type ToastApi = {
  success: (message: string) => void
  info: (message: string) => void
  error: (message: string) => void
}

type NotifyDirectImportOptions<TIcon> = {
  onImported?: (icons: TIcon[]) => void
  toastApi?: ToastApi
}

export function hasExternalFiles(types: Iterable<string> | null | undefined): boolean {
  if (!types) return false
  return Array.from(types).includes('Files')
}

export function resolveImportCollectionId(collectionId: string | null): string | null {
  if (!collectionId || collectionId === 'favorites') return null
  return collectionId
}

export function buildDropOverlayLabel(title: string): string {
  const trimmed = title.trim()

  if (!trimmed || trimmed === 'Favorites' || trimmed === 'All Icons') {
    return 'Drop to import icons'
  }

  return `Drop to import into ${trimmed}`
}

export async function importFilesDirectly<TIcon>({
  files,
  collectionId,
  isSupportedFile,
  isSvgFile,
  isIcnsFile,
  convertSvgFile,
  convertIcnsFile,
  convertRasterFile,
  extractName,
  importItems,
}: ImportFilesDirectlyOptions<TIcon>): Promise<DirectImportOutcome<TIcon>> {
  const supportedFiles = files.filter((file) => isSupportedFile(file))

  if (supportedFiles.length === 0) {
    return { status: 'empty' }
  }

  const items: DirectImportItem[] = []
  const errors: string[] = []

  for (const file of supportedFiles) {
    try {
      let svgContent: string

      if (isSvgFile(file)) {
        svgContent = await convertSvgFile(file)
      } else if (isIcnsFile(file)) {
        svgContent = await convertIcnsFile(file)
      } else {
        svgContent = await convertRasterFile(file)
      }

      items.push({
        name: extractName(file.name),
        svgContent,
        collectionId,
        source: 'upload',
      })
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Import failed'}`)
    }
  }

  if (items.length === 0) {
    return {
      status: 'success',
      result: {
        imported: 0,
        skipped: 0,
        errors,
        icons: [],
      },
    }
  }

  try {
    const result = await importItems(items)

    return {
      status: 'success',
      result: {
        ...result,
        errors: [...result.errors, ...errors],
      },
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Import failed',
    }
  }
}

export function notifyDirectImportOutcome<TIcon>(
  outcome: DirectImportOutcome<TIcon>,
  { onImported, toastApi }: NotifyDirectImportOptions<TIcon>
): void {
  if (outcome.status === 'empty') {
    toastApi?.error('No supported files found')
    return
  }

  if (outcome.status === 'error') {
    toastApi?.error(outcome.error || 'Import failed')
    return
  }

  const { result } = outcome

  if (result.imported > 0) {
    toastApi?.success(`Imported ${result.imported} icon${result.imported > 1 ? 's' : ''}`)
    onImported?.(result.icons)
  }

  if (result.skipped > 0) {
    toastApi?.info(`Skipped ${result.skipped} duplicate${result.skipped > 1 ? 's' : ''}`)
  }

  if (result.errors.length > 0) {
    toastApi?.error(`${result.errors.length} failed`)
  }
}
