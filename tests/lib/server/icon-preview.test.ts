import test from 'node:test'
import assert from 'node:assert/strict'

import { createIconPreviewResponse } from '../../../lib/server/icon-preview.ts'

test('createIconPreviewResponse returns 401 when the request is unauthenticated', async () => {
  let queried = false

  const response = await createIconPreviewResponse('icon-123', {
    getUser: async () => null,
    getIconById: async () => {
      queried = true
      return null
    },
  })

  assert.equal(response.status, 401)
  assert.equal(await response.text(), 'Unauthorized')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(queried, false)
})

test('createIconPreviewResponse returns 404 when the icon does not belong to the current user', async () => {
  const response = await createIconPreviewResponse('icon-123', {
    getUser: async () => ({ id: 'user-123' }),
    getIconById: async (iconId, userId) => {
      assert.equal(iconId, 'icon-123')
      assert.equal(userId, 'user-123')
      return null
    },
  })

  assert.equal(response.status, 404)
  assert.equal(await response.text(), 'Not Found')
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('createIconPreviewResponse normalizes SVG markup and returns it as an image response', async () => {
  const response = await createIconPreviewResponse('icon-123', {
    getUser: async () => ({ id: 'user-123' }),
    getIconById: async () => ({
      svg_content:
        '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"><svg viewBox="0 0 24 24"><rect width="24" height="24"/></svg>',
    }),
  })

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/svg+xml; charset=utf-8')
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')

  const body = await response.text()

  assert.doesNotMatch(body, /<\?xml/i)
  assert.doesNotMatch(body, /<!DOCTYPE/i)
  assert.match(body, /^<svg/)
  assert.match(body, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
})
