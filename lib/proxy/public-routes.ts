const PUBLIC_ASSET_PATH_PATTERN =
  /^\/(?:favicon\.ico|icon(?:\.[^/]+)?|apple-icon(?:\.[^/]+)?|manifest(?:\.webmanifest)?|robots\.txt|sitemap\.xml)$/

export function isPublicAssetPath(pathname: string): boolean {
  return PUBLIC_ASSET_PATH_PATTERN.test(pathname)
}
