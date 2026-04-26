const METADATA_ASSET_PATH_PATTERN =
  /^\/(?:favicon\.ico|icon(?:\.[^/]+)?|apple-icon(?:\.[^/]+)?|manifest(?:\.webmanifest)?|robots\.txt|sitemap\.xml)$/
const PUBLIC_FILE_PATH_PATTERN = /\/[^/]+\.[^/]+$/

export function isPublicAssetPath(pathname: string): boolean {
  return METADATA_ASSET_PATH_PATTERN.test(pathname) || PUBLIC_FILE_PATH_PATTERN.test(pathname)
}
