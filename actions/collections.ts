'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Collection } from '@/types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function createCollection(data: {
  name: string
  emoji?: string | null
  color?: string | null
  parent_id?: string | null
}): Promise<Collection> {
  const { supabase, user } = await getUser()

  const { data: existing } = await supabase
    .from('collections')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('parent_id', data.parent_id ?? null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sort_order = (existing?.sort_order ?? -1) + 1

  const { data: collection, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: data.name,
      emoji: data.emoji ?? null,
      color: data.color ?? null,
      parent_id: data.parent_id ?? null,
      sort_order,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/', 'layout')
  return collection
}

export async function updateCollection(
  id: string,
  changes: Partial<Pick<Collection, 'name' | 'emoji' | 'color' | 'parent_id' | 'sort_order'>>
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('collections')
    .update(changes)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/', 'layout')
}

export async function deleteCollection(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/', 'layout')
}

export async function getCollections(): Promise<Collection[]> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}
