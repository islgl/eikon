'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unauthorized = searchParams.get('error') === 'unauthorized'

  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Incorrect email or password' : error.message)
    } else {
      router.push('/library')
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">Eikon</div>
          <p className="text-sm text-muted-foreground">Your personal icon library</p>
        </div>

        {unauthorized && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            This email is not authorized to access Eikon.
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-9 text-sm">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <button type="button" onClick={() => setMode('reset')} className="hover:text-foreground transition-colors">
                Forgot password?
              </button>
            </p>
          </form>
        ) : resetSent ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-5 text-sm">
            <p className="font-medium">Check your email</p>
            <p className="text-muted-foreground">
              Reset link sent to <span className="font-medium text-foreground">{email}</span>
            </p>
            <button onClick={() => { setMode('login'); setResetSent(false) }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
              <Input
                id="reset-email"
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
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <button type="button" onClick={() => setMode('login')} className="hover:text-foreground transition-colors">
                Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
