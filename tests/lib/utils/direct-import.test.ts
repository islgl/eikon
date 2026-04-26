import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDropOverlayLabel,
  hasExternalFiles,
  importFilesDirectly,
  resolveImportCollectionId,
} from '../../../lib/utils/direct-import.ts'

test('hasExternalFiles only returns true when Files is present', () => {
  assert.equal(hasExternalFiles(['text/plain']), false)
  assert.equal(hasExternalFiles(['Files']), true)
  assert.equal(hasExternalFiles(['text/plain', 'Files']), true)
})

test('resolveImportCollectionId maps virtual favorites to the root library', () => {
  assert.equal(resolveImportCollectionId('favorites'), null)
  assert.equal(resolveImportCollectionId(null), null)
  assert.equal(resolveImportCollectionId('collection-1'), 'collection-1')
})

test('buildDropOverlayLabel uses generic copy for special library pages', () => {
  assert.equal(buildDropOverlayLabel('Favorites'), 'Drop to import icons')
  assert.equal(buildDropOverlayLabel('All Icons'), 'Drop to import icons')
  assert.equal(buildDropOverlayLabel('Design System'), 'Drop to import into Design System')
})

test('importFilesDirectly returns empty when no supported files remain', async () => {
  const calls: string[] = []

  const result = await importFilesDirectly({
    files: [new File(['ignored'], 'notes.txt', { type: 'text/plain' })],
    collectionId: null,
    isSupportedFile: () => false,
    isSvgFile: () => false,
    isIcnsFile: () => false,
    convertSvgFile: async () => {
      calls.push('svg')
      return '<svg />'
    },
    convertIcnsFile: async () => {
      calls.push('icns')
      return '<svg />'
    },
    convertRasterFile: async () => {
      calls.push('raster')
      return '<svg />'
    },
    extractName: () => 'ignored',
    importItems: async () => {
      calls.push('import')
      return { imported: 0, skipped: 0, errors: [], icons: [] }
    },
  })

  assert.deepEqual(calls, [])
  assert.deepEqual(result, { status: 'empty' })
})

test('importFilesDirectly converts supported files and imports them into the requested collection', async () => {
  const importedItems: Array<{ name: string; svgContent: string; collectionId: string | null; source: 'upload' }> = []

  const result = await importFilesDirectly({
    files: [new File(['<svg xmlns="http://www.w3.org/2000/svg" />'], 'cloud.svg', { type: 'image/svg+xml' })],
    collectionId: 'collection-1',
    isSupportedFile: () => true,
    isSvgFile: () => true,
    isIcnsFile: () => false,
    convertSvgFile: async () => '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"/></svg>',
    convertIcnsFile: async () => '<svg />',
    convertRasterFile: async () => '<svg />',
    extractName: (filename) => filename.replace('.svg', ''),
    importItems: async (items) => {
      importedItems.push(...items)
      return {
        imported: items.length,
        skipped: 0,
        errors: [],
        icons: [{ id: 'icon-1', name: items[0]?.name ?? 'unknown' }],
      }
    },
  })

  assert.deepEqual(importedItems, [
    {
      name: 'cloud',
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"/></svg>',
      collectionId: 'collection-1',
      source: 'upload',
    },
  ])
  assert.equal(result.status, 'success')
  assert.equal(result.result?.imported, 1)
  assert.deepEqual(result.result?.icons, [{ id: 'icon-1', name: 'cloud' }])
})

test('importFilesDirectly keeps valid files even when one conversion fails', async () => {
  const files = [
    new File(['<svg xmlns="http://www.w3.org/2000/svg" />'], 'cloud.svg', { type: 'image/svg+xml' }),
    new File(['png'], 'broken.png', { type: 'image/png' }),
  ]

  const result = await importFilesDirectly({
    files,
    collectionId: null,
    isSupportedFile: () => true,
    isSvgFile: (file) => file.name.endsWith('.svg'),
    isIcnsFile: () => false,
    convertSvgFile: async () => '<svg xmlns="http://www.w3.org/2000/svg" />',
    convertIcnsFile: async () => '<svg />',
    convertRasterFile: async () => {
      throw new Error('Failed to read file')
    },
    extractName: (filename) => filename.replace(/\.[^.]+$/, ''),
    importItems: async (items) => ({
      imported: items.length,
      skipped: 0,
      errors: [],
      icons: [{ id: 'icon-1', name: items[0]?.name ?? 'unknown' }],
    }),
  })

  assert.equal(result.status, 'success')
  assert.equal(result.result?.imported, 1)
  assert.deepEqual(result.result?.errors, ['broken.png: Failed to read file'])
})
