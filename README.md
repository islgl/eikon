<div align="center">

# Eikon

**A personal icon manager. Import, organize, and export icons — all in one place.**

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy%20with-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/islgl/eikon)

</div>

---

## What is Eikon?

Designers and developers accumulate icons from dozens of sources — icon sets, custom exports, screenshots, brand assets. Eikon gives them a single home: import from any source, organize into collections, and get your icons back in any format instantly.

## Features

### Import anything
- Drag-and-drop or pick files: **SVG, PNG, JPG, WebP, GIF, ICO, ICNS**
- Import from a URL — any image format, not just SVG
- ICNS files are automatically unpacked to the highest-resolution frame
- Raster images are stored as SVG wrappers for format consistency

### Organize
- **Collections** — nested folders with emoji and color labels
- **Tags** — cross-collection labeling with color coding
- **Favorites** — quick-access starred icons
- Drag icons between collections in the sidebar

### Export
- Copy as **SVG source**, **JSX component**, or **Data URI** — one click
- Download as **SVG** or **PNG** at any size (16 → 128px)
- Generate a signed **storage URL** for direct CDN access

### Search & browse
- Fuzzy search across icon names and tags
- Filter by collection or tag
- Grid and list views with virtual scrolling
- ⌘K command palette for instant navigation

## Stack

```
Next.js 16  ·  Supabase (Postgres + Auth + Storage)  ·  TypeScript
Tailwind CSS  ·  Base UI  ·  Framer Motion  ·  @dnd-kit
```

## Self-Hosting

### 1. Clone

```bash
git clone https://github.com/islgl/eikon.git
cd eikon
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then copy your credentials.

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — restrict sign-in to specific emails
ALLOWED_EMAILS=you@example.com
```

### 4. Initialize the database

In your Supabase **SQL Editor**, run the contents of:

```
supabase/migrations/0001_init.sql
```

### 5. Create a Storage bucket

In Supabase **Storage**, create a **private** bucket named `icons`, then run:

```sql
create policy "Users access own icon files" on storage.objects
  for all using (auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. Run

```bash
npm run dev
# → http://localhost:3000
```

### Deploy to Vercel

```bash
npx vercel --prod
```

Set the three environment variables in your Vercel project dashboard, then redeploy.

---

## Project Layout

```
eikon/
├── app/
│   ├── (app)/              # Protected: library, favorites, collections
│   └── auth/               # Login, callback, password reset
├── actions/                # Server Actions — icons, collections, import
├── components/
│   ├── icon-grid/          # Cards, virtual grid, empty-state dropzone
│   ├── icon-detail/        # Side panel: copy, download, metadata
│   ├── import/             # Upload + URL import dialogs
│   └── layout/             # Sidebar, collection tree, app shell, DnD
├── lib/
│   ├── hooks/              # useCollections, useIcons, useDndMove …
│   └── utils/              # SVG sanitize, image convert, copy helpers
└── supabase/
    └── migrations/         # Schema: collections, icons, tags
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs are welcome.

## License

[MIT](LICENSE)
