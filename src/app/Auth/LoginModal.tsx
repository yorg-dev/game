import { useState } from 'react'
import { useAuthProvider } from 'ra-core'
import type { AuthProvider } from 'ra-core'

interface Props {
  onSuccess: () => void
  onCancel: () => void
  defaultTab?: 'login' | 'register'
}

const btnPrimary =
  'px-4 py-1.5 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] text-sm font-bold hover:brightness-110 active:shadow-[inset_0_-1px_0_0_#5a3810,inset_0_1px_0_0_#c8a060] disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]'
const btnGhost =
  'px-4 py-1.5 rounded-lg border-2 border-[#9a6b28] bg-[#dcc898] text-[#5a3810] text-sm font-bold hover:bg-[#c8b07a] transition-colors'
const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810] transition-colors'

export function LoginModal({ onSuccess, onCancel, defaultTab = 'login' }: Props) {
  const authProvider = useAuthProvider() as AuthProvider & { register?: (params: { email: string; password: string }) => Promise<void> }
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
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M10 2L2 10M2 2l8 8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b-4 border-[#7a5230] bg-[#dcc898] pr-14">
          <h2 className="text-[#3d2010] font-bold text-base">
            {isLogin ? 'Load World' : 'Save Progress'}
          </h2>
          <p className="text-xs text-[#7a5230] pt-0.5">
            {isLogin
              ? 'Sign in to continue your saved world.'
              : 'Create an account to save your progress.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[#7a5230] bg-[#dcc898]">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={[
                'flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
                tab === t
                  ? 'text-[#3d2010] border-b-2 border-[#3d2010] -mb-[2px]'
                  : 'text-[#9a6b28] hover:text-[#7a5230]',
              ].join(' ')}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">
              Email
            </label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              required
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t-4 border-[#7a5230] bg-[#dcc898] -mx-5 -mb-5 px-5 py-4">
            <button type="button" onClick={onCancel} className={btnGhost}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email.trim() || !password || loading}
              className={btnPrimary}
            >
              {loading
                ? isLogin
                  ? 'Signing in…'
                  : 'Creating account…'
                : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
