import { useState } from 'react'
import { useAuthProvider } from 'ra-core'
import type { AuthProvider } from 'ra-core'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
  GameDialogDescription,
  GameDialogFooter,
  gameBtn,
  gameBtnGhost,
  gameInput,
} from '@/components/ui/game-dialog'

interface Props {
  onSuccess: () => void
  onCancel: () => void
  defaultTab?: 'login' | 'register'
}

export function LoginModal({ onSuccess, onCancel, defaultTab = 'login' }: Props) {
  const authProvider = useAuthProvider() as AuthProvider & {
    register?: (params: { email: string; password: string }) => Promise<void>
  }
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchTab(t: 'login' | 'register') {
    setTab(t)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setError(null)
    setLoading(true)
    try {
      if (tab === 'login') {
        await authProvider.login({ username: email.trim(), password })
      } else {
        await authProvider.register?.({ email: email.trim(), password })
      }
      onSuccess()
    } catch (err: any) {
      setError(
        err?.message ??
          (tab === 'login'
            ? 'Login failed. Please check your credentials.'
            : 'Registration failed. Please try again.'),
      )
    } finally {
      setLoading(false)
    }
  }

  const isLogin = tab === 'login'

  return (
    <GameDialog open onOpenChange={(o) => !o && onCancel()}>
      <GameDialogContent className="max-w-sm">
        <GameDialogHeader className="pr-14">
          <GameDialogTitle>{isLogin ? 'Load World' : 'Save Progress'}</GameDialogTitle>
          <GameDialogDescription>
            {isLogin
              ? 'Sign in to continue your saved world.'
              : 'Create an account to save your progress.'}
          </GameDialogDescription>
        </GameDialogHeader>

        {/* Tabs */}
        <div className="flex border-b-2 border-wood-700 bg-parchment-250">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={[
                'flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
                tab === t
                  ? 'text-soil-800 border-b-2 border-soil-800 -mb-[2px]'
                  : 'text-wood-600 hover:text-wood-700',
              ].join(' ')}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
              Email
            </label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={gameInput}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={gameInput}
              required
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <GameDialogFooter className="-mx-5 -mb-5">
            <button type="button" onClick={onCancel} className={gameBtnGhost}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email.trim() || !password || loading}
              className={gameBtn}
            >
              {loading
                ? isLogin
                  ? 'Signing in…'
                  : 'Creating account…'
                : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </GameDialogFooter>
        </form>
      </GameDialogContent>
    </GameDialog>
  )
}
