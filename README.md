<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667EEA,100:764BA2&height=220&text=Eikon&fontSize=90&fontColor=ffffff&fontAlignY=40&desc=Personal%20Icon%20Manager&descSize=22&descAlignY=63&descColor=ffffffcc&animation=fadeIn" width="100%" />

<img src="public/logo.svg" width="80" height="80" alt="Eikon logo" />

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=500&size=18&duration=2800&pause=600&color=888888&center=true&vCenter=true&width=600&height=36&lines=Import+SVG%2C+PNG%2C+JPG%2C+ICO%2C+ICNS+and+more;Organize+into+nested+collections+with+drag+%26+drop;Export+to+SVG%2C+JSX%2C+PNG+in+one+click" />

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy%20with-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/new)

</div>

---

## Features

### 📥 Import anything
- Drag-and-drop or pick files — **SVG, PNG, JPG, WebP, GIF, ICO, ICNS**
- Import from a URL (any image format, not just SVG)
- ICNS files are automatically unpacked to the highest-resolution frame
- Raster images wrapped as SVG for storage consistency

### 🗂️ Organize
- **Nested collections** with emoji and color labels
- **Tag system** with color coding
- **Favorites** for quick access
- **Drag icons between collections** in the sidebar

### 📤 Export
- Copy as **SVG source**, **JSX component**, or **Data URI** — one click
- Download as **SVG** or **PNG** at any size (16 → 128px)
- Generate a signed **Storage URL** for direct CDN access

### 🔍 Search & browse
- Fuzzy search across names and tags
- Grid and list views with virtual scrolling
- **⌘K** command palette

---

## Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=nextjs,ts,react,tailwind,supabase,vercel&theme=dark" />

</div>

---

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

In your Supabase **SQL Editor**, run:

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

Set the three environment variables in Vercel project settings, then redeploy.

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

---

## License

[MIT](LICENSE)

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:764BA2,100:667EEA&height=100&section=footer" width="100%" />
</div>
