// SVG parsing, sanitization, and dimension extraction utilities

const ALLOWED_SVG_TAGS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'textPath', 'image', 'use', 'defs', 'symbol', 'marker', 'clipPath',
  'mask', 'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feFlood', 'feGaussianBlur',
  'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'feSpecularLighting',
  'feTile', 'feTurbulence', 'linearGradient', 'radialGradient', 'stop', 'title', 'desc',
])

const FORBIDDEN_ATTRS = new Set([
  'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
  'onchange', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown',
  'onmouseenter', 'onmouseleave', 'onmouseup', 'onscroll', 'onsubmit',
])

export function sanitizeSvg(svgString: string): string {
  // Quick check: must start with <svg
  const trimmed = svgString.trim()
  if (!trimmed.startsWith('<svg') && !trimmed.includes('<svg')) {
    throw new Error('Not a valid SVG')
  }

  // Strip script tags and event handlers (works for both browser + server)
  let clean = svgString
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, 'data-safe:')

  return clean.trim()
}

export function extractSvgDimensions(svgString: string): { width: number; height: number } {
  // Try to parse width/height attributes
  const widthMatch = svgString.match(/\bwidth\s*=\s*["']?(\d+(?:\.\d+)?)/i)
  const heightMatch = svgString.match(/\bheight\s*=\s*["']?(\d+(?:\.\d+)?)/i)

  if (widthMatch && heightMatch) {
    return { width: parseFloat(widthMatch[1]), height: parseFloat(heightMatch[1]) }
  }

  // Fallback: parse viewBox
  const viewBoxMatch = svgString.match(/viewBox\s*=\s*["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i)
  if (viewBoxMatch) {
    return { width: parseFloat(viewBoxMatch[1]), height: parseFloat(viewBoxMatch[2]) }
  }

  return { width: 24, height: 24 }
}

export function extractSvgName(filename: string): string {
  return filename
    .replace(/\.svg$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function normalizeSvg(svgString: string): string {
  // Ensure SVG has xmlns
  let svg = svgString.trim()
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  return svg
}

export function svgToDataUri(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
  return `data:image/svg+xml,${encoded}`
}

export function svgToBase64DataUri(svgString: string): string {
  const base64 = btoa(unescape(encodeURIComponent(svgString)))
  return `data:image/svg+xml;base64,${base64}`
}

// Convert SVG to JSX component format
export function svgToJsx(svgString: string, componentName: string): string {
  const name = componentName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')

  // Convert SVG attributes to JSX
  let jsx = svgString
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/stop-color=/g, 'stopColor=')
    .replace(/stop-opacity=/g, 'stopOpacity=')
    .replace(/font-family=/g, 'fontFamily=')
    .replace(/font-size=/g, 'fontSize=')
    .replace(/font-weight=/g, 'fontWeight=')
    .replace(/text-anchor=/g, 'textAnchor=')
    .replace(/xlink:href=/g, 'href=')
    .replace(/xml:space=/g, 'xmlSpace=')

  return `export function ${name}Icon(props: React.SVGProps<SVGSVGElement>) {\n  return (\n    ${jsx.replace(/<svg/, '<svg {...props}')}\n  )\n}\n`
}

// Hash SVG content for duplicate detection
export async function hashSvg(svgString: string): Promise<string> {
  const normalized = svgString.replace(/\s+/g, ' ').trim()
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
