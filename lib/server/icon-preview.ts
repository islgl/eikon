type PreviewUser = {
  id: string
}

type PreviewIcon = {
  svg_content: string
}

type CreateIconPreviewResponseOptions = {
  getUser: () => Promise<PreviewUser | null>
  getIconById: (iconId: string, userId: string) => Promise<PreviewIcon | null>
}

function normalizePreviewSvg(svgContent: string): string {
  let svg = svgContent
    .replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '')
    .replace(/<!DOCTYPE[\s\S]*?>\s*/gi, '')
    .trim()

  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  return svg
}

export async function createIconPreviewResponse(
  iconId: string,
  options: CreateIconPreviewResponseOptions
): Promise<Response> {
  const user = await options.getUser()

  if (!user) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }

  const icon = await options.getIconById(iconId, user.id)

  if (!icon) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }

  return new Response(normalizePreviewSvg(icon.svg_content), {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
