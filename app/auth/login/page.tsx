'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">Eikon</div>
          <p className="text-sm text-muted-foreground">Your personal icon library</p>
        </div>

        {sent ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-5 text-sm">
            <p className="font-medium">Check your email</p>
            <p className="text-muted-foreground">
              We sent a magic link to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-9 text-sm"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-9 text-sm">
              {loading ? 'Sending…' : 'Continue with email'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
