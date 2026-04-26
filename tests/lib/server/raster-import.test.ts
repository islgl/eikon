import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'

import sharp from 'sharp'

import {
  buildSvgWrapperFromRaster,
  compressRasterUploadIfNeeded,
  RASTER_COMPRESSION_THRESHOLD_BYTES,
  shouldCompressRasterUpload,
} from '../../../lib/server/raster-import.ts'

test('shouldCompressRasterUpload only compresses files larger than 1MB', () => {
  assert.equal(shouldCompressRasterUpload(512_000), false)
  assert.equal(shouldCompressRasterUpload(RASTER_COMPRESSION_THRESHOLD_BYTES), false)
  assert.equal(shouldCompressRasterUpload(RASTER_COMPRESSION_THRESHOLD_BYTES + 1), true)
})

test('buildSvgWrapperFromRaster keeps the provided intrinsic dimensions', () => {
  const svg = buildSvgWrapperFromRaster({
    mimeType: 'image/png',
    base64: 'Zm9v',
    width: 128,
    height: 64,
  })

  assert.match(svg, /viewBox="0 0 128 64"/)
  assert.match(svg, /width="128"/)
  assert.match(svg, /height="64"/)
  assert.match(svg, /data:image\/png;base64,Zm9v/)
})

test('compressRasterUploadIfNeeded leaves sub-threshold raster uploads untouched', async () => {
  const input = await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: { r: 32, g: 120, b: 200, alpha: 1 },
    },
  })
    .png()
    .toBuffer()

  const result = await compressRasterUploadIfNeeded({
    buffer: input,
    mimeType: 'image/png',
    fileSize: input.length,
  })

  assert.equal(result.compressed, false)
  assert.equal(result.mimeType, 'image/png')
  assert.equal(result.width, 32)
  assert.equal(result.height, 32)
  assert.equal(Buffer.from(result.buffer).equals(input), true)
})

test('compressRasterUploadIfNeeded recompresses oversized raster uploads', async () => {
  const width = 1200
  const height = 1200
  const raw = randomBytes(width * height * 3)
  const input = await sharp(raw, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()

  assert.equal(input.length > RASTER_COMPRESSION_THRESHOLD_BYTES, true)

  const result = await compressRasterUploadIfNeeded({
    buffer: input,
    mimeType: 'image/png',
    fileSize: input.length,
  })

  assert.equal(result.compressed, true)
  assert.equal(result.mimeType, 'image/webp')
  assert.equal(result.width > 0, true)
  assert.equal(result.height > 0, true)
  assert.equal(result.buffer.length < input.length, true)
})
