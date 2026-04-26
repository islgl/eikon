import { createClient } from '@/lib/supabase/server'
import { createIconPreviewResponse } from '@/lib/server/icon-preview'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: RouteContext<'/api/icon-preview/[iconId]'>) {
  const { iconId } = await context.params
  const supabase = await createClient()

  return createIconPreviewResponse(iconId, {
    async getUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      return { id: user.id }
    },
    async getIconById(id, userId) {
      const { data, error } = await supabase
        .from('icons')
        .select('svg_content')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

      if (error || !data) {
        return null
      }

      return data
    },
  })
}
