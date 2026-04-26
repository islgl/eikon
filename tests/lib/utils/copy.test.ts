import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

import { downloadPng, downloadSvg } from '../../../lib/utils/copy.ts'

type Restore = () => void

function replaceGlobal(name: string, value: unknown): Restore {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)

  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: true,
  })

  return () => {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
      return
    }

    delete (globalThis as Record<string, unknown>)[name]
  }
}

function installDownloadDom() {
  const events: string[] = []
  let nextBlobId = 1

  const anchor = {
    href: '',
    download: '',
    click() {
      events.push('click:a')
    },
  }

  const canvasContext = {
    drawImage() {
      events.push('drawImage')
    },
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext(kind: string) {
      assert.equal(kind, '2d')
      events.push('canvas:getContext')
      return canvasContext
    },
    toBlob(callback: BlobCallback, type?: string) {
      events.push(`canvas:toBlob:${type ?? 'unknown'}`)
      callback(new Blob(['png'], { type: type ?? 'image/png' }))
    },
  }

  class MockImage {
    onerror: null | ((error: unknown) => void) = null
    onload: null | (() => void) = null

    set src(value: string) {
      events.push(`image:src:${value}`)
      queueMicrotask(() => this.onload?.())
    }
  }

  const documentStub = {
    body: {
      appendChild(node: unknown) {
        events.push('append')
        return node
      },
      removeChild(node: unknown) {
        events.push('remove')
        return node
      },
    },
    createElement(tagName: string) {
      if (tagName === 'a') {
        events.push('create:a')
        return anchor
      }

      if (tagName === 'canvas') {
        events.push('create:canvas')
        return canvas
      }

      throw new Error(`Unexpected element requested in test: ${tagName}`)
    },
  }

  const urlStub = {
    createObjectURL() {
      const nextUrl = `blob:mock-${nextBlobId++}`
      events.push(`createObjectURL:${nextUrl}`)
      return nextUrl
    },
    revokeObjectURL(url: string) {
      events.push(`revokeObjectURL:${url}`)
    },
  }

  const restores = [
    replaceGlobal('document', documentStub),
    replaceGlobal('Image', MockImage),
    replaceGlobal('URL', urlStub),
  ]

  return {
    anchor,
    events,
    restore() {
      restores.reverse().forEach((restore) => restore())
    },
  }
}

test('downloadSvg waits until the next task before revoking the blob URL', async (t) => {
  const env = installDownloadDom()
  t.after(() => env.restore())

  await downloadSvg('<svg xmlns="http://www.w3.org/2000/svg" />', 'logo')

  assert.deepEqual(env.events, [
    'createObjectURL:blob:mock-1',
    'create:a',
    'append',
    'click:a',
    'remove',
  ])
  assert.equal(env.anchor.download, 'logo.svg')

  await delay(0)

  assert.deepEqual(env.events, [
    'createObjectURL:blob:mock-1',
    'create:a',
    'append',
    'click:a',
    'remove',
    'revokeObjectURL:blob:mock-1',
  ])
})

test('downloadPng keeps the downloadable blob URL alive until after the click task', async (t) => {
  const env = installDownloadDom()
  t.after(() => env.restore())

  await downloadPng('<svg xmlns="http://www.w3.org/2000/svg" />', 'logo', 64)

  assert.deepEqual(env.events, [
    'create:canvas',
    'canvas:getContext',
    'createObjectURL:blob:mock-1',
    'image:src:blob:mock-1',
    'drawImage',
    'revokeObjectURL:blob:mock-1',
    'canvas:toBlob:image/png',
    'createObjectURL:blob:mock-2',
    'create:a',
    'append',
    'click:a',
    'remove',
  ])
  assert.equal(env.anchor.download, 'logo-64px.png')

  await delay(0)

  assert.deepEqual(env.events, [
    'create:canvas',
    'canvas:getContext',
    'createObjectURL:blob:mock-1',
    'image:src:blob:mock-1',
    'drawImage',
    'revokeObjectURL:blob:mock-1',
    'canvas:toBlob:image/png',
    'createObjectURL:blob:mock-2',
    'create:a',
    'append',
    'click:a',
    'remove',
    'revokeObjectURL:blob:mock-2',
  ])
})
