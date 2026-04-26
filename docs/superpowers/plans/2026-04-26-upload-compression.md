# Upload Compression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the 1MB-style file import bottleneck by moving file uploads to a backend route and automatically compressing oversized raster images server-side.

**Architecture:** File-based imports will submit `FormData` to a route handler instead of serializing `svgContent` through a Server Action. The server will sanitize SVG files, compress oversized raster uploads with `sharp`, then reuse shared persistence logic to store icons in the same SVG-backed format as before.

**Tech Stack:** Next.js 16 route handlers, React 19 client components, Supabase, sharp, node:test, TypeScript

---

### Task 1: Add failing tests for backend raster processing helpers

**Files:**
- Create: `tests/lib/server/raster-import.test.ts`
- Create: `lib/server/raster-import.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildSvgWrapperFromRaster,
  shouldCompressRasterUpload,
} from '../../../lib/server/raster-import.ts'

test('shouldCompressRasterUpload only compresses files larger than 1MB', () => {
  assert.equal(shouldCompressRasterUpload(512_000), false)
  assert.equal(shouldCompressRasterUpload(1_200_000), true)
})

test('buildSvgWrapperFromRaster keeps the provided intrinsic dimensions', async () => {
  const svg = buildSvgWrapperFromRaster({
    mimeType: 'image/png',
    base64: 'Zm9v',
    width: 128,
    height: 64,
  })

  assert.match(svg, /viewBox="0 0 128 64"/)
  assert.match(svg, /data:image\/png;base64,Zm9v/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/lib/server/raster-import.test.ts`
Expected: FAIL because `lib/server/raster-import.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function shouldCompressRasterUpload(fileSize: number): boolean {
  return fileSize > 1_000_000
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/lib/server/raster-import.test.ts`
Expected: partial PASS and remaining failures for unimplemented helpers.

- [ ] **Step 5: Commit**

```bash
git add tests/lib/server/raster-import.test.ts lib/server/raster-import.ts
git commit -m "test: add raster import helper coverage"
```

### Task 2: Implement shared server import logic and backend upload route

**Files:**
- Create: `app/api/import/files/route.ts`
- Create: `lib/server/import-files.ts`
- Modify: `actions/import.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('shouldCompressRasterUpload marks oversized files for backend recompression', () => {
  assert.equal(shouldCompressRasterUpload(2_500_000), true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/lib/server/raster-import.test.ts`
Expected: FAIL until the raster helper behavior is fully implemented.

- [ ] **Step 3: Write minimal implementation**

```ts
export const RASTER_COMPRESSION_THRESHOLD_BYTES = 1_000_000
export const UPLOAD_BODY_LIMIT = '25mb'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/lib/server/raster-import.test.ts`
Expected: PASS for raster helper coverage.

- [ ] **Step 5: Commit**

```bash
git add app/api/import/files/route.ts lib/server/import-files.ts lib/server/raster-import.ts actions/import.ts next.config.ts tests/lib/server/raster-import.test.ts
git commit -m "feat: add backend-compressed file import route"
```

### Task 3: Wire client file import entry points to the backend route

**Files:**
- Modify: `lib/utils/direct-import-client.ts`
- Modify: `components/icon-grid/empty-dropzone.tsx`
- Modify: `components/icon-grid/library-view.tsx`
- Modify: `components/import/dropzone-tab.tsx`

- [ ] **Step 1: Write the failing test**

```ts
test('shouldCompressRasterUpload keeps sub-threshold uploads untouched', () => {
  assert.equal(shouldCompressRasterUpload(128_000), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/lib/server/raster-import.test.ts`
Expected: FAIL if helper thresholds or behavior drift from the intended upload path.

- [ ] **Step 3: Write minimal implementation**

```ts
const formData = new FormData()
for (const file of files) formData.append('files', file)
await fetch('/api/import/files', { method: 'POST', body: formData })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/lib/server/raster-import.test.ts`
Expected: PASS for helper coverage after wiring the client path.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/direct-import-client.ts components/icon-grid/empty-dropzone.tsx components/icon-grid/library-view.tsx components/import/dropzone-tab.tsx
git commit -m "feat: route file imports through backend compression"
```

### Task 4: Verify the complete flow

**Files:**
- Test: `tests/lib/server/raster-import.test.ts`
- Test: `app/api/import/files/route.ts`
- Test: `components/import/dropzone-tab.tsx`
- Test: `components/icon-grid/library-view.tsx`

- [ ] **Step 1: Run targeted tests**

```bash
node --test tests/lib/server/raster-import.test.ts
```

- [ ] **Step 2: Run production build**

```bash
npm run build
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Manually verify**

```text
1. Drag a large PNG or JPG into /library and confirm it imports successfully.
2. Upload the same file from the Import dialog and confirm it succeeds.
3. Import an SVG and confirm it stays visually identical.
4. Confirm duplicate handling and toasts still work.
```

- [ ] **Step 5: Commit**

```bash
git add next.config.ts actions/import.ts app/api/import/files/route.ts lib/server/import-files.ts lib/server/raster-import.ts lib/utils/direct-import-client.ts components/icon-grid/empty-dropzone.tsx components/icon-grid/library-view.tsx components/import/dropzone-tab.tsx tests/lib/server/raster-import.test.ts
git commit -m "feat: remove small upload bottleneck with backend compression"
```
