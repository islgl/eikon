export const ACCEPTED_IMAGE_TYPES = {
  'image/svg+xml': ['.svg'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/x-icon': ['.ico'],
  'image/vnd.microsoft.icon': ['.ico'],
  'image/x-icns': ['.icns'],
} as const

export const ACCEPTED_EXTENSIONS_LABEL = 'SVG, PNG, JPG, WebP, GIF, ICO, ICNS'

const ACCEPTED_MIME_TYPES = new Set(Object.keys(ACCEPTED_IMAGE_TYPES))
const ACCEPTED_EXTENSIONS = new Set(
  Object.values(ACCEPTED_IMAGE_TYPES)
    .flat()
    .map((extension) => extension.toLowerCase())
)

export function isAcceptedImageFile(file: Pick<File, 'name' | 'type'>): boolean {
  const type = file.type.toLowerCase()

  if (type && ACCEPTED_MIME_TYPES.has(type)) {
    return true
  }

  const lowerName = file.name.toLowerCase()

  for (const extension of ACCEPTED_EXTENSIONS) {
    if (lowerName.endsWith(extension)) {
      return true
    }
  }

  return false
}

export function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
}

export function isIcnsFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.icns')
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk))
  }
  return btoa(binary)
}

function wrapInSvg(dataUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth || 64
      const h = img.naturalHeight || 64
      resolve(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><image href="${dataUri}" width="${w}" height="${h}"/></svg>`
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUri
  })
}

// ICNS icon types ordered by preference (largest first)
const ICNS_PREFERRED = ['ic10', 'ic14', 'ic09', 'ic13', 'ic08', 'ic12', 'ic07', 'ic11', 'icp6', 'icp5', 'icp4']
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]

export async function icnsFileToSvgContent(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  if (magic !== 'icns') throw new Error('Not a valid ICNS file')

  const fileSize = view.getUint32(4, false)
  const pngIcons = new Map<string, Uint8Array>()

  let offset = 8
  while (offset + 8 <= Math.min(fileSize, bytes.length)) {
    const type = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
    const size = view.getUint32(offset + 4, false)
    if (size < 8) break

    const data = bytes.slice(offset + 8, offset + size)
    const isPng = data.length >= 4 && PNG_MAGIC.every((b, i) => data[i] === b)
    if (isPng) pngIcons.set(type, data)

    offset += size
  }

  let pngData: Uint8Array | undefined
  for (const type of ICNS_PREFERRED) {
    if (pngIcons.has(type)) { pngData = pngIcons.get(type); break }
  }
  if (!pngData) pngData = pngIcons.values().next().value
  if (!pngData) throw new Error('No PNG icon found in ICNS file')

  const dataUri = `data:image/png;base64,${uint8ArrayToBase64(pngData)}`
  return wrapInSvg(dataUri)
}

export function rasterFileToSvgContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target?.result as string
      wrapInSvg(dataUri).then(resolve).catch(reject)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
