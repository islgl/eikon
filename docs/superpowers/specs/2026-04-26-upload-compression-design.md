# Upload Compression Design

**Date:** 2026-04-26

## Goal

Remove the practical 1MB upload ceiling for imported image files and automatically compress large raster uploads on the backend before storing them, while keeping SVG imports lossless.

## Root Cause

Current file-based imports convert images into `svgContent` strings in the browser and then send that payload through a Next.js Server Action. Next.js Server Actions default to a `1MB` request body limit, so larger images fail before they can be imported.

## Scope

- Move file-based imports off the current client-to-Server-Action `svgContent` path.
- Add a backend file upload endpoint for imported files.
- Compress large raster uploads on the backend.
- Preserve SVG uploads without compression.
- Update all file-based import entry points to use the new backend path.
- Raise Next.js body limits to practical values for this app.

## Non-Goals

- Changing copy/download/export behavior.
- Reworking URL import UX.
- Introducing a separate asset processing queue.

## UX

- Users should be able to import large files without seeing the previous 1MB-style failure.
- Existing import entry points remain the same:
  - main library drag-and-drop
  - empty-state dropzone
  - upload tab in the import dialog
- Toast behavior remains unchanged: imported, skipped duplicates, and failed counts still show as before.

## Architecture

### Backend Upload Path

Add a route handler at `app/api/import/files/route.ts` that accepts `multipart/form-data` uploads. This avoids pushing large serialized `svgContent` payloads through a Server Action.

### Shared Server Import Logic

Extract the actual icon persistence logic from `actions/import.ts` into a reusable server module so both:

- the new upload route
- existing URL import and SVG import flows

can store imported icons consistently.

### Raster Compression

For file uploads:

- SVG files:
  - sanitize and store as before
  - no compression
- Raster files:
  - if the original file is small enough, store it as-is inside the SVG wrapper
  - if the original file is larger than the compression threshold, compress it on the backend with `sharp`
  - wrap the resulting raster bytes in SVG, preserving the existing “store everything as SVG” model

### Compression Policy

Recommended initial policy:

- Compression threshold: 1MB
- Compression target: WebP output for oversized raster uploads
- Quality: high quality, visually conservative
- Resize: contain within a reasonable max dimension to avoid pathological huge assets

This keeps normal imports untouched while automatically shrinking large files.

## Config

Update `next.config.ts` to increase relevant body limits:

- `experimental.serverActions.bodySizeLimit`
- `experimental.proxyClientMaxBodySize`

This covers both current behavior and the new backend route path when large uploads pass through proxy.

## Error Handling

- Unsupported file types continue to fail with the existing “No supported files found” style messaging.
- Compression failures should fall back to per-file import errors rather than crashing the whole batch.
- Duplicate detection remains unchanged and still happens per collection.

## Testing Strategy

- Add targeted tests for backend raster compression helpers:
  - small raster files skip compression
  - oversized raster files are recompressed
  - SVG files are not passed through raster compression
- Verify build succeeds with the new server-side `sharp` usage.
- Manually verify:
  - drag/drop large PNG or JPG into `/library`
  - upload a file via the import dialog
  - import an SVG and confirm it remains unchanged in quality
