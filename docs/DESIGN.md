# Eikon — Design Document

## Overview

Eikon is a personal icon library manager, similar to IconJar, built as a web application. It allows you to import, organize, search, and use SVG icons efficiently with a polished Notion-inspired interface.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | Shadcn/UI + Tailwind CSS v4 + Base UI |
| Database | Supabase (Postgres + Storage + Auth) |
| Animations | Framer Motion |
| Virtualization | @tanstack/react-virtual |
| Search | Fuse.js (client-side fuzzy) |

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your Project URL and anon key from **Settings → API**
3. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run database migrations

In the Supabase SQL Editor, paste and run `supabase/migrations/0001_init.sql`.

### 3. Create storage bucket

In Supabase Storage, create a bucket named `icons` (private). Then add this RLS policy:

```sql
create policy "Users access own icon files" on storage.objects
  for all using (auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Enable Auth

In **Authentication → Providers**, ensure **Email** is enabled with "Confirm email" (magic link).

### 5. Run locally

```bash
npm install
npm run dev
```

---

## Data Model

```
collections          icons              tags
──────────────       ──────────────     ──────────────
id                   id                 id
user_id              user_id            user_id
name                 collection_id      name
emoji                name               color
color                svg_content
parent_id ──┐        storage_path
sort_order  │        width/height
created_at  │        source (upload/paste/url)
updated_at  └──▶     source_url         icon_tags
                     is_favorite        ──────────────
                     metadata           icon_id ──▶ icons
                     created_at         tag_id  ──▶ tags
                     updated_at
```

Collections are self-referential (parent_id) to support nesting like Notion pages.

---

## Architecture

```
app/
├── page.tsx                    → redirect to /library
├── auth/
│   ├── login/page.tsx          client: magic link form
│   └── callback/route.ts       exchanges code for session
└── (app)/
    ├── layout.tsx              RSC: fetch collections + tags, render AppShell
    ├── library/
    │   ├── page.tsx            RSC: fetch all icons
    │   └── [collectionId]/
    │       └── page.tsx        RSC: fetch collection + icons
    └── favorites/
        └── page.tsx            RSC: fetch favorite icons

components/
├── layout/
│   ├── app-shell.tsx           client: wraps sidebar + main + command palette
│   ├── sidebar.tsx             client: collapsible nav + collection tree
│   ├── collection-tree.tsx     recursive tree renderer
│   └── collection-item.tsx     single row: expand, link, rename, delete
├── icon-grid/
│   ├── library-view.tsx        client: holds all icon state, renders toolbar+grid+panel
│   ├── icon-grid.tsx           virtualized grid/list via @tanstack/react-virtual
│   ├── icon-card.tsx           icon tile: hover actions, context menu
│   ├── icon-list-row.tsx       list mode row
│   └── icon-toolbar.tsx        search, sort, size slider, view toggle, bulk actions
├── icon-detail/
│   └── icon-detail-panel.tsx   slide-in panel: preview, copy, download, color, meta
├── import/
│   ├── import-dialog.tsx       tabbed dialog
│   ├── dropzone-tab.tsx        drag-drop SVG files
│   ├── paste-svg-tab.tsx       paste raw SVG code
│   └── url-import-tab.tsx      fetch SVG from URL (server-side)
└── command/
    └── command-palette.tsx     ⌘K palette: navigate + search

actions/
├── icons.ts                    CRUD, favorites, tags, move
├── collections.ts              CRUD
└── import.ts                   batch import + URL import (server-side fetch)
```

---

## Design Language

Inspired by Notion's clean, editorial aesthetic:

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FFFFFF` | `#191919` |
| Sidebar bg | `#F7F7F5` | `#202020` |
| Hover state | `#EFEFEF` | `#2F2F2F` |
| Border | subtle gray, 1px | subtle white/10% |
| Radius | 6px cards, 4px inputs | |
| Font | Inter / Geist (system) | |
| Animations | 150ms ease, no bounce | |

### Icon Cards (grid mode)
- Square tile, icon centered
- Hover → shows name label below, copy + favorite buttons above
- Click → select / deselect
- Double-click → open detail panel
- Right-click → context menu (copy, details, delete)
- Shift/⌘+click → multi-select

### Sidebar
- 240px expanded / 52px collapsed (animated)
- Collection tree: nested, collapsible, inline rename on click
- Footer: theme toggle + sign out

---

## Icon Import Pipeline

```
User drags SVGs / pastes code / provides URL
        ↓
  [Client] sanitizeSvg()       ← strips <script>, event handlers
        ↓
  [Client] extractDimensions() ← from width/height or viewBox
        ↓
  [Server Action] importIcons()
        ├── uploadToStorage()  → Supabase Storage bucket
        └── insertIcon()       → Supabase Postgres icons table
        ↓
  React state update (optimistic) + cache revalidation
```

---

## Copy Formats

| Format | Output |
|--------|--------|
| SVG | Raw `<svg>...</svg>` string |
| JSX Component | `export function ArrowRightIcon(props) { return <svg {...props}>... }` |
| Data URI | `data:image/svg+xml,<encoded>` |

PNG download uses Canvas API at sizes: 16, 24, 32, 48, 64, 128px.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Open command palette |
| Escape | Close panel / deselect |
| ⌘A | Select all icons |
| Delete / Backspace | Delete selected icons |
| Arrow keys | Navigate grid |
| ⌘C | Copy selected icon SVG |
