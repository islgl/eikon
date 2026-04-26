'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Icon, Tag } from '@/types'

export const ICONS_PAGE_SIZE = 100

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function getIcons(
  collectionId?: string | null,
  offset = 0
): Promise<{ icons: Icon[]; hasMore: boolean }> {
  const { supabase, user } = await getUser()

  let query = supabase
    .from('icons')
    .select(`*, tags:icon_tags(tag:tags(*))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + ICONS_PAGE_SIZE - 1)

  if (collectionId === 'favorites') {
    query = query.eq('is_favorite', true)
  } else if (collectionId) {
    query = query.eq('collection_id', collectionId)
  }

  const { data, error } = await query
  if (error) throw error

  const icons = (data ?? []).map((icon: any) => ({
    ...icon,
    tags: icon.tags?.map((t: any) => t.tag).filter(Boolean) ?? [],
  }))

  return { icons, hasMore: icons.length === ICONS_PAGE_SIZE }
}

export async function updateIcon(
  id: string,
  changes: Partial<Pick<Icon, 'name' | 'collection_id' | 'is_favorite' | 'svg_content'>>
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('icons')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function deleteIcons(ids: string[]): Promise<void> {
  const { supabase, user } = await getUser()

  const { data: icons } = await supabase
    .from('icons')
    .select('id, storage_path')
    .in('id', ids)
    .eq('user_id', user.id)

  const storagePaths = icons?.filter((i: any) => i.storage_path).map((i: any) => i.storage_path) ?? []
  if (storagePaths.length > 0) {
    await supabase.storage.from('icons').remove(storagePaths)
  }

  const { error } = await supabase
    .from('icons')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/library', 'layout')
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('icons')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function setIconTags(iconId: string, tagIds: string[]): Promise<void> {
  const { supabase, user } = await getUser()

  const { error: ownerErr } = await supabase
    .from('icons')
    .select('id')
    .eq('id', iconId)
    .eq('user_id', user.id)
    .single()
  if (ownerErr) throw ownerErr

  await supabase.from('icon_tags').delete().eq('icon_id', iconId)
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from('icon_tags')
      .insert(tagIds.map((tid) => ({ icon_id: iconId, tag_id: tid })))
    if (error) throw error
  }
}

export async function moveIcons(iconIds: string[], collectionId: string | null): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('icons')
    .update({ collection_id: collectionId, updated_at: new Date().toISOString() })
    .in('id', iconIds)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/library', 'layout')
}

export async function getTags(): Promise<Tag[]> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createTag(name: string, color: string): Promise<Tag> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: user.id, name, color })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTag(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function getIconSignedUrl(iconId: string): Promise<string> {
  const { supabase, user } = await getUser()
  const { data: icon } = await supabase
    .from('icons')
    .select('storage_path')
    .eq('id', iconId)
    .eq('user_id', user.id)
    .single()
  if (!icon?.storage_path) throw new Error('Icon not found')
  const { data } = await supabase.storage
    .from('icons')
    .createSignedUrl(icon.storage_path, 604800)
  if (!data?.signedUrl) throw new Error('Failed to generate URL')
  return data.signedUrl
}
