import sharp from 'sharp'

export const RASTER_COMPRESSION_THRESHOLD_BYTES = 1_000_000
export const MAX_RASTER_DIMENSION_PX = 2048
export const COMPRESSED_RASTER_MIME_TYPE = 'image/webp'

const ICNS_PREFERRED = ['ic10', 'ic14', 'ic09', 'ic13', 'ic08', 'ic12', 'ic07', 'ic11', 'icp6', 'icp5', 'icp4']
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]

type SvgWrapperOptions = {
  mimeType: string
  base64: string
  width: number
  height: number
}

type CompressRasterUploadOptions = {
  buffer: Uint8Array
  mimeType: string
  fileSize: number
}

type RasterImportResult = {
  buffer: Uint8Array
  mimeType: string
  width: number
  height: number
  compressed: boolean
}

function supportsAnimatedInput(mimeType: string): boolean {
  return mimeType === 'image/gif' || mimeType === 'image/webp'
}

function normalizeDimension(value: number | undefined | null): number {
  return Math.max(1, Math.round(value ?? 64))
}

export function shouldCompressRasterUpload(fileSize: number): boolean {
  return fileSize > RASTER_COMPRESSION_THRESHOLD_BYTES
}

export function buildSvgWrapperFromRaster({ mimeType, base64, width, height }: SvgWrapperOptions): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image href="data:${mimeType};base64,${base64}" width="${width}" height="${height}"/></svg>`
}

export function bufferToBase64(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString('base64')
}

export function extractPreferredIcnsPng(buffer: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

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
    const isPng = data.length >= 4 && PNG_MAGIC.every((value, index) => data[index] === value)
    if (isPng) {
      pngIcons.set(type, data)
    }

    offset += size
  }

  let selected: Uint8Array | undefined
  for (const type of ICNS_PREFERRED) {
    if (pngIcons.has(type)) {
      selected = pngIcons.get(type)
      break
    }
  }

  if (!selected) {
    selected = pngIcons.values().next().value
  }

  if (!selected) {
    throw new Error('No PNG icon found in ICNS file')
  }

  return Buffer.from(selected)
}

async function readRasterMetadata(buffer: Uint8Array, mimeType: string) {
  return sharp(Buffer.from(buffer), { animated: supportsAnimatedInput(mimeType) }).metadata()
}

export async function compressRasterUploadIfNeeded({
  buffer,
  mimeType,
  fileSize,
}: CompressRasterUploadOptions): Promise<RasterImportResult> {
  const originalMetadata = await readRasterMetadata(buffer, mimeType)
  const originalWidth = normalizeDimension(originalMetadata.width)
  const originalHeight = normalizeDimension(originalMetadata.height)

  if (!shouldCompressRasterUpload(fileSize)) {
    return {
      buffer,
      mimeType,
      width: originalWidth,
      height: originalHeight,
      compressed: false,
    }
  }

  let pipeline = sharp(Buffer.from(buffer), { animated: supportsAnimatedInput(mimeType) }).rotate()

  if (Math.max(originalWidth, originalHeight) > MAX_RASTER_DIMENSION_PX) {
    pipeline = pipeline.resize({
      width: MAX_RASTER_DIMENSION_PX,
      height: MAX_RASTER_DIMENSION_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const compressedBuffer = await pipeline.webp({
    quality: 88,
    alphaQuality: 100,
    effort: 4,
    nearLossless: true,
  }).toBuffer()

  const compressedMetadata = await readRasterMetadata(compressedBuffer, COMPRESSED_RASTER_MIME_TYPE)

  return {
    buffer: compressedBuffer,
    mimeType: COMPRESSED_RASTER_MIME_TYPE,
    width: normalizeDimension(compressedMetadata.width ?? originalMetadata.width),
    height: normalizeDimension(compressedMetadata.height ?? originalMetadata.height),
    compressed: true,
  }
}
