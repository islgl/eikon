import test from 'node:test'
import assert from 'node:assert/strict'

import { isPublicAssetPath } from '../../../lib/proxy/public-routes.ts'

test('metadata icon asset paths stay public', () => {
  assert.equal(isPublicAssetPath('/favicon.ico'), true)
  assert.equal(isPublicAssetPath('/icon.svg'), true)
  assert.equal(isPublicAssetPath('/icon.png'), true)
  assert.equal(isPublicAssetPath('/apple-icon.png'), true)
  assert.equal(isPublicAssetPath('/logo.svg'), true)
  assert.equal(isPublicAssetPath('/images/logo.svg'), true)
})

test('application pages do not become public assets', () => {
  assert.equal(isPublicAssetPath('/'), false)
  assert.equal(isPublicAssetPath('/auth/login'), false)
  assert.equal(isPublicAssetPath('/library'), false)
  assert.equal(isPublicAssetPath('/library/collection-a'), false)
})
