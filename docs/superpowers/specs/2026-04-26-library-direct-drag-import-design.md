# Library Direct Drag Import Design

**Date:** 2026-04-26

## Goal

Let users drag supported image files directly onto the main library content area to import them into the current context, without needing to open the `Import` dialog first.

## Scope

- Add an external-file drop target to the right-side library content area in `LibraryView`.
- Keep the existing empty-state dropzone and import dialog.
- Reuse one direct-import pipeline for:
  - the empty-state dropzone
  - the new non-empty content-area drop target
- Import dropped files directly into the current collection context when possible.

## Non-Goals

- Replacing the existing `Import` dialog upload tab.
- Changing the URL import flow.
- Expanding external drag-and-drop to the full app window.
- Changing the existing internal icon-to-collection drag behavior.

## UX

### Drop Target Boundary

The new drop target only covers the right-side content area rendered by `LibraryView`. The sidebar remains dedicated to the existing internal drag-and-drop interaction for moving icons between collections.

### Visual States

- Empty library state:
  - Continue using the current large empty-state dropzone.
  - It should use the same shared direct-import logic as the non-empty state.
- Non-empty library state:
  - Show a lightweight overlay when the user drags external files over the content area.
  - The overlay should not appear for internal app drags.
- Importing state:
  - While an import is running, ignore new drops and show loading feedback instead of allowing duplicate submissions.

### Overlay Copy

- Standard collection page: `Drop to import into {collection title}`
- Favorites page: `Drop to import icons`
- All Icons page: `Drop to import icons`

The copy intentionally avoids implying that imports go “into Favorites”.

## Behavior

### Drag Detection

Only external drags containing `DataTransfer.types` with `Files` should activate the content-area import overlay. Internal app drags from `@dnd-kit/core` must not trigger the import UI.

### Import Flow

1. User drags supported files into the content area.
2. Shared direct-import logic converts files into `ImportItem[]`.
3. The existing `importIcons` server action persists them.
4. Newly imported icons are appended to the local library state through the existing `onImported` callback.
5. Existing toast behavior is preserved for imported, skipped, and failed files.

### File Handling

The shared import pipeline keeps the current conversion behavior:

- SVG: sanitize and import directly
- ICNS: extract the preferred PNG frame and wrap it as SVG
- Raster images: wrap the original raster in SVG without changing its intrinsic dimensions

This preserves the current “store as SVG” strategy and keeps imported visual quality unchanged.

## Architecture

### Shared Import Logic

Extract the direct file-to-import pipeline from `components/icon-grid/empty-dropzone.tsx` into a shared client utility that:

- accepts `File[]`
- converts them into `ImportItem[]`
- calls `importIcons`
- returns the import result

The utility should also centralize toast-friendly result handling so empty-state and non-empty-state paths stay consistent.

### Library Content Drop State

`components/icon-grid/library-view.tsx` will own the non-empty content-area drag state because it already knows:

- current `collectionId`
- current `title`
- how to append imported icons to local state
- whether the view is empty or populated

The overlay should wrap the existing `IconGrid` area only.

### Empty State Reuse

`components/icon-grid/empty-dropzone.tsx` should be simplified to call the shared direct-import helper instead of embedding its own conversion/import pipeline.

### Dialog Upload Flow

`components/import/dropzone-tab.tsx` remains unchanged in behavior. It is the explicit “review files then import” flow and should continue to work independently of direct content-area drop.

## Error Handling

- Unsupported or invalid drops should reuse existing error messaging.
- Partial success should preserve the current toast pattern:
  - success toast for imported files
  - info toast for skipped duplicates
  - error toast for failed files
- A new drop received during an active import should be ignored rather than queued.

## Testing Strategy

Use TDD on extracted pure helpers first.

### Automated Tests

- Add tests for the shared direct-import helper:
  - supported files are converted and imported
  - empty input reports “no supported files”
  - duplicate / partial-failure responses preserve result reporting
- Add tests for drag-state helpers:
  - external file drags are detected from `DataTransfer.types`
  - internal drags without `Files` are ignored
  - overlay label logic uses generic copy for Favorites and All Icons

### Verification

- Run the targeted `node:test` suite for the new helpers.
- Run lint and a production build to catch client/server boundary issues.
- Manually verify in the running app:
  - dragging files into a populated library imports directly
  - dragging files into an empty library still works
  - dragging icons inside the app still moves them between collections
