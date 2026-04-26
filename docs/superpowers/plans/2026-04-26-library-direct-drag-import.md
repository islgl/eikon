# Library Direct Drag Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users drag supported image files onto the library content area to import directly into the current view without opening the import dialog.

**Architecture:** Extract a shared client-side direct-import helper from the empty-state dropzone, then let `LibraryView` own a lightweight external-file drag overlay for non-empty states. Keep internal `@dnd-kit/core` icon dragging untouched by gating the overlay on `DataTransfer.types` containing `Files`.

**Tech Stack:** Next.js 16 client components, React 19, react-dropzone, node:test, TypeScript

---

### Task 1: Add failing tests for shared import helpers

**Files:**
- Create: `tests/lib/utils/direct-import.test.ts`
- Create: `lib/utils/direct-import.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDropOverlayLabel,
  hasExternalFiles,
  importFilesDirectly,
} from '../../../lib/utils/direct-import.ts'

test('hasExternalFiles only returns true when Files is present', () => {
  assert.equal(hasExternalFiles(['text/plain']), false)
  assert.equal(hasExternalFiles(['Files']), true)
})

test('buildDropOverlayLabel uses generic copy for special library pages', () => {
  assert.equal(buildDropOverlayLabel('Favorites'), 'Drop to import icons')
  assert.equal(buildDropOverlayLabel('All Icons'), 'Drop to import icons')
  assert.equal(buildDropOverlayLabel('Cloud'), 'Drop to import into Cloud')
})

test('importFilesDirectly converts and imports supported files', async () => {
  const result = await importFilesDirectly({
    files: [new File(['<svg xmlns="http://www.w3.org/2000/svg" />'], 'cloud.svg', { type: 'image/svg+xml' })],
    collectionId: 'c1',
    convertSvgFile: async () => '<svg xmlns="http://www.w3.org/2000/svg" />',
    convertIcnsFile: async () => '<svg xmlns="http://www.w3.org/2000/svg" />',
    convertRasterFile: async () => '<svg xmlns="http://www.w3.org/2000/svg" />',
    extractName: () => 'cloud',
    importItems: async (items) => ({
      imported: items.length,
      skipped: 0,
      errors: [],
      icons: [{ id: '1', name: 'cloud' }],
    }),
  })

  assert.equal(result.status, 'success')
  assert.equal(result.result?.imported, 1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/lib/utils/direct-import.test.ts`
Expected: FAIL because `lib/utils/direct-import.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function hasExternalFiles(types: Iterable<string>): boolean {
  return Array.from(types).includes('Files')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/lib/utils/direct-import.test.ts`
Expected: still FAIL for the remaining unimplemented helpers.

- [ ] **Step 5: Commit**

```bash
git add tests/lib/utils/direct-import.test.ts lib/utils/direct-import.ts
git commit -m "test: add direct import helper coverage"
```

### Task 2: Implement the shared direct-import helper

**Files:**
- Modify: `lib/utils/direct-import.ts`
- Modify: `components/icon-grid/empty-dropzone.tsx`

- [ ] **Step 1: Write the failing test**

```ts
test('importFilesDirectly returns empty when no supported files are provided', async () => {
  const result = await importFilesDirectly({
    files: [],
    collectionId: null,
    convertSvgFile: async () => '',
    convertIcnsFile: async () => '',
    convertRasterFile: async () => '',
    extractName: () => '',
    importItems: async () => ({ imported: 0, skipped: 0, errors: [], icons: [] }),
  })

  assert.equal(result.status, 'empty')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/lib/utils/direct-import.test.ts`
Expected: FAIL because `importFilesDirectly` does not return the expected empty status yet.

- [ ] **Step 3: Write minimal implementation**

```ts
if (files.length === 0) {
  return { status: 'empty' as const }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/lib/utils/direct-import.test.ts`
Expected: PASS for the empty-input case and previous cases.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/direct-import.ts components/icon-grid/empty-dropzone.tsx tests/lib/utils/direct-import.test.ts
git commit -m "feat: share direct file import logic"
```

### Task 3: Add LibraryView drop overlay integration

**Files:**
- Modify: `components/icon-grid/library-view.tsx`

- [ ] **Step 1: Write the failing test**

```ts
test('buildDropOverlayLabel includes collection names for normal collections', () => {
  assert.equal(buildDropOverlayLabel('Design System'), 'Drop to import into Design System')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/lib/utils/direct-import.test.ts`
Expected: FAIL if label behavior is not implemented exactly.

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildDropOverlayLabel(title: string): string {
  return title === 'Favorites' || title === 'All Icons'
    ? 'Drop to import icons'
    : `Drop to import into ${title}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/lib/utils/direct-import.test.ts`
Expected: PASS for overlay label behavior.

- [ ] **Step 5: Commit**

```bash
git add components/icon-grid/library-view.tsx lib/utils/direct-import.ts tests/lib/utils/direct-import.test.ts
git commit -m "feat: add library drag to import overlay"
```

### Task 4: Verify project integrity

**Files:**
- Test: `tests/lib/utils/direct-import.test.ts`
- Test: `components/icon-grid/library-view.tsx`
- Test: `components/icon-grid/empty-dropzone.tsx`

- [ ] **Step 1: Run targeted tests**

```bash
node --test tests/lib/utils/direct-import.test.ts
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Run production build**

```bash
npm run build
```

- [ ] **Step 4: Manually verify in the app**

```text
1. Open /library with existing icons and drag in an SVG or PNG.
2. Confirm the overlay appears and the icons import immediately on drop.
3. Open an empty collection and verify the empty-state dropzone still imports.
4. Drag an existing icon to a collection in the sidebar and confirm internal drag behavior still works.
```

- [ ] **Step 5: Commit**

```bash
git add components/icon-grid/library-view.tsx components/icon-grid/empty-dropzone.tsx lib/utils/direct-import.ts tests/lib/utils/direct-import.test.ts
git commit -m "feat: support direct library drag imports"
```
