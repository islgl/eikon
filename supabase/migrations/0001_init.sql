-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Collections table
create table if not exists collections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  emoji       text,
  color       text,
  parent_id   uuid references collections(id) on delete cascade,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Icons table
create table if not exists icons (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  collection_id uuid references collections(id) on delete set null,
  name          text not null,
  svg_content   text not null,
  storage_path  text,
  width         integer,
  height        integer,
  source        text not null check (source in ('upload', 'paste', 'url')),
  source_url    text,
  is_favorite   boolean not null default false,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Tags table
create table if not exists tags (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  name      text not null,
  color     text not null default 'gray',
  unique (user_id, name)
);

-- Icon-Tag join table
create table if not exists icon_tags (
  icon_id  uuid not null references icons(id) on delete cascade,
  tag_id   uuid not null references tags(id) on delete cascade,
  primary key (icon_id, tag_id)
);

-- Indexes
create index if not exists icons_user_id_idx on icons(user_id);
create index if not exists icons_collection_id_idx on icons(collection_id);
create index if not exists icons_is_favorite_idx on icons(user_id, is_favorite);
create index if not exists collections_user_id_idx on collections(user_id);
create index if not exists collections_parent_id_idx on collections(parent_id);

-- Full-text search index on icon name
create index if not exists icons_name_fts_idx on icons using gin(to_tsvector('english', name));

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger icons_updated_at before update on icons
  for each row execute procedure update_updated_at();
create trigger collections_updated_at before update on collections
  for each row execute procedure update_updated_at();

-- RLS Policies
alter table collections enable row level security;
alter table icons enable row level security;
alter table tags enable row level security;
alter table icon_tags enable row level security;

-- Collections RLS
create policy "Users own their collections"
  on collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Icons RLS
create policy "Users own their icons"
  on icons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tags RLS
create policy "Users own their tags"
  on tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Icon Tags RLS (via icons ownership)
create policy "Users own their icon_tags"
  on icon_tags for all
  using (
    exists (
      select 1 from icons where icons.id = icon_tags.icon_id and icons.user_id = auth.uid()
    )
  );

-- Storage bucket (run separately in Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public) values ('icons', 'icons', false);
-- create policy "Users access own icon files" on storage.objects
--   for all using (auth.uid()::text = (storage.foldername(name))[1]);
