# Changelog

## [Unreleased]

### Added
- Drag and drop icons onto sidebar collections to move them
- Right-click context menu: Rename icon inline
- Drag overlay follows cursor precisely with card preview
- GitHub icon link in toolbar top-right corner
- Import button moved to filter bar; hover animation (icon nudges up) and pointer cursor
- Eikon logo (Grid A variant) — SVG mark + favicon
- Direct drag-and-drop file import into the main library content area (without opening the Import dialog first)
- Backend multipart upload route for file imports with server-side raster processing

### Changed
- Drop target collision detection aligned with cursor position (`snapCenterToCursor` on `DndContext`)
- Import button repositioned from title row to filter bar right end
- PNG downloads now preserve the icon's original dimensions by default and keep aspect ratio when exporting smaller sizes
- File uploads now bypass the 1MB Server Action payload path and use backend processing instead
- Oversized raster imports are automatically compressed server-side before being wrapped and stored
- Next.js upload body limits increased to 25MB for import flows

### Fixed
- Icon SVG / PNG downloads no longer stall when the browser receives the request but never starts saving the file
- PNG export no longer fails on legacy SVG files that include broken XML declarations or `DOCTYPE` headers
- Large image imports no longer fail at around 1MB due to the default Server Action body limit
- Imports from Favorites no longer attempt to target a virtual `favorites` collection ID
- App metadata icon routes (`/icon.svg`, `/favicon.ico`, etc.) no longer get redirected to login by the auth proxy

---

## [0.2.0] — 2026-04-21

### Added
- Multi-format import: SVG, PNG, JPG, WebP, GIF, ICO, ICNS
  - Raster images are wrapped in an SVG `<image>` element for storage compatibility
  - ICNS files: extracts the largest PNG frame automatically
- Empty collection drop zone — drag files or click to import without opening a dialog
- Download icon: SVG and PNG (multiple sizes) from detail panel; SVG / PNG 64px from right-click menu
- Copy URL: generates a 7-day signed Supabase Storage URL, available in card right-click and detail panel
- Import immediately updates the grid without manual refresh (server action returns created icon rows)
- New collection auto-enters rename mode on creation
- Icon name always visible below the card (previously hover-only)
- Password login with "Forgot password?" reset flow (replaced magic link)
- Email allowlist via `ALLOWED_EMAILS` environment variable

### Changed
- Removed "Paste SVG" import tab
- From URL import now supports all image formats, not just SVG
- Collection default icon changed from 📁 emoji to Lucide `Folder` for visual consistency
- System font stack (SF Pro / Segoe UI) replacing Geist
- Icon card layout restructured: dedicated zones for action buttons, icon, and name — buttons no longer overlap icon
- Card size increased (`iconSize + 48`) for better proportions
- Copy SVG / Download SVG hidden for raster-wrapped icons (PNG/JPG/etc.)
- Color picker hidden in detail panel for raster icons

### Fixed
- `CommandInput` crash ("cannot read properties of undefined: subscribe") — missing `<Command>` context wrapper in `CommandDialog`
- Import action `data:` sanitization no longer breaks base64 image data URIs

---

## [0.1.0] — 2026-04-21

### Added
- Initial release: icon manager with Supabase backend
- Collections with nested tree, drag-to-expand, inline rename
- Icon grid (virtual scroll) and list view
- Search, sort, filter by tag and collection
- Detail panel: preview, color tint, copy as SVG / JSX / Data URI, download SVG / PNG
- Favorites
- Tag system
- Import: file upload (SVG), paste SVG, URL
- Magic link email authentication
- Dark / light mode
