// Client-side types (include computed/joined fields)
export type Collection = {
  id: string
  user_id: string
  name: string
  emoji: string | null
  color: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  // client-side computed
  children?: Collection[]
  icon_count?: number
}

export type Icon = {
  id: string
  user_id: string
  collection_id: string | null
  name: string
  svg_content: string
  storage_path: string | null
  width: number | null
  height: number | null
  source: 'upload' | 'paste' | 'url'
  source_url: string | null
  is_favorite: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // joined
  tags?: Tag[]
}

export type Tag = {
  id: string
  user_id: string
  name: string
  color: string
}

export type IconTag = {
  icon_id: string
  tag_id: string
}

export type CopyFormat = 'svg' | 'jsx' | 'data-uri'

export type ViewMode = 'grid' | 'list'

export type SortOrder = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'

export type ImportSource = 'upload' | 'paste' | 'url'

export type ImportItem = {
  name: string
  svgContent: string
  collectionId?: string | null
  sourceUrl?: string | null
  source: ImportSource
}

// Supabase Database type — flat DB-level types only (regenerate with supabase gen types)
export type Database = {
  public: {
    Tables: {
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string | null
          color: string | null
          parent_id: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          emoji?: string | null
          color?: string | null
          parent_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          emoji?: string | null
          color?: string | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
      }
      icons: {
        Row: {
          id: string
          user_id: string
          collection_id: string | null
          name: string
          svg_content: string
          storage_path: string | null
          width: number | null
          height: number | null
          source: string
          source_url: string | null
          is_favorite: boolean
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collection_id?: string | null
          name: string
          svg_content: string
          storage_path?: string | null
          width?: number | null
          height?: number | null
          source: string
          source_url?: string | null
          is_favorite?: boolean
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          collection_id?: string | null
          name?: string
          svg_content?: string
          storage_path?: string | null
          width?: number | null
          height?: number | null
          source?: string
          source_url?: string | null
          is_favorite?: boolean
          metadata?: Record<string, unknown> | null
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
        }
      }
      icon_tags: {
        Row: {
          icon_id: string
          tag_id: string
        }
        Insert: {
          icon_id: string
          tag_id: string
        }
        Update: {
          icon_id?: string
          tag_id?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
