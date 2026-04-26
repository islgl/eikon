import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { IconPreview } from '../../components/icon-grid/icon-preview.ts'

function extractImageSrc(html: string): string {
  const match = html.match(/src="([^"]+)"/)
  assert.ok(match, 'expected rendered markup to include an image src')
  return match[1]
}

test('IconPreview renders SVG previews as data-uri images instead of inline markup', () => {
  const html = renderToStaticMarkup(
    createElement(IconPreview, {
      svgContent: '<svg viewBox="0 0 24 24"><rect width="24" height="24"/></svg>',
      className: 'h-6 w-6',
    })
  )

  assert.match(html, /<img/)
  assert.match(html, /class="icon-preview h-6 w-6"/)
  assert.match(html, /alt=""/)
  assert.match(html, /aria-hidden="true"/)
  assert.match(extractImageSrc(html), /^data:image\/svg\+xml;base64,/)
})

test('IconPreview normalizes SVG markup before encoding it for preview images', () => {
  const html = renderToStaticMarkup(
    createElement(IconPreview, {
      svgContent:
        '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"><svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>',
    })
  )

  const src = extractImageSrc(html)
  const encoded = src.replace('data:image/svg+xml;base64,', '')
  const decoded = Buffer.from(encoded, 'base64').toString('utf8')

  assert.doesNotMatch(decoded, /<\?xml/i)
  assert.doesNotMatch(decoded, /<!DOCTYPE/i)
  assert.match(decoded, /^<svg/)
  assert.match(decoded, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
})
