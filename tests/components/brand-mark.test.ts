import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { BrandMark } from '../../components/brand/brand-mark.ts'

test('BrandMark renders the shared logo asset with the app brand name by default', () => {
  const html = renderToStaticMarkup(createElement(BrandMark))

  assert.match(html, /<img[^>]+src="\/logo\.svg"/)
  assert.match(html, /alt="Eikon"/)
  assert.match(html, /width="160"/)
  assert.match(html, /height="160"/)
})

test('BrandMark can render as a decorative asset next to visible brand text', () => {
  const html = renderToStaticMarkup(createElement(BrandMark, { decorative: true }))

  assert.match(html, /alt=""/)
  assert.match(html, /aria-hidden="true"/)
})
