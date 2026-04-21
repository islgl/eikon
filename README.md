# Eikon

A personal icon manager built with Next.js and Supabase. Import, organize, and export icons in any format.

**Live demo:** [eikon.lglgl.me](https://eikon.lglgl.me)

## Features

- **Import anything** — SVG, PNG, JPG, WebP, GIF, ICO, ICNS; drag-and-drop or URL
- **Collections** — nested folders with emoji/color, drag icons between them
- **Search & filter** — fuzzy search, tag filtering, sort by name or date
- **Export** — copy as SVG, JSX component, or Data URI; download SVG or PNG at any size
- **Copy URL** — generates a signed Supabase Storage URL (7-day validity)
- **Favorites** — quick access to frequently used icons
- **Keyboard shortcuts** — ⌘K command palette for navigation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Database & Auth | Supabase (Postgres, Auth, Storage) |
| UI | Base UI, Tailwind CSS, Framer Motion |
| Drag & Drop | @dnd-kit |
| Deployment | Vercel |

## Self-Hosting

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) A [Vercel](https://vercel.com) account for deployment

### 1. Clone and install

```bash
git clone https://github.com/islgl/eikon.git
cd eikon
npm install
```

### 2. Configure environment

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: restrict access to specific emails (comma-separated)
ALLOWED_EMAILS=you@example.com
```

Find these values in your Supabase project under **Settings → API**.

### 3. Initialize the database

Run the migration in your Supabase **SQL Editor**:

```bash
# Contents of supabase/migrations/0001_init.sql
```

Or paste the file contents directly into the SQL Editor.

This creates the `collections`, `icons`, `tags`, and `icon_tags` tables with RLS policies.

### 4. Create Storage bucket

In Supabase **Storage**, create a private bucket named `icons`, then run:

```sql
create policy "Users access own icon files" on storage.objects
  for all using (auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### Deploy to Vercel

```bash
vercel --prod
```

Add the three environment variables in your Vercel project settings.

## Project Structure

```
app/
├── (app)/          # Protected routes (library, favorites, collections)
├── auth/           # Login, callback, password reset
actions/            # Next.js Server Actions (icons, collections, import)
components/
├── icon-grid/      # Icon cards, grid virtualization, empty state
├── icon-detail/    # Side panel with copy/download options
├── import/         # Upload, URL import dialogs
├── layout/         # Sidebar, collection tree, app shell
lib/
├── hooks/          # useCollections, useIcons, useDndMove, etc.
├── utils/          # SVG sanitization, image conversion, copy helpers
supabase/
└── migrations/     # Database schema
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
