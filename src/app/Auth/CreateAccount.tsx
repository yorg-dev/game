import { useState } from 'react'
import { useDataProvider } from 'ra-core'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

const btnPrimary =
  'px-4 py-1.5 rounded-lg border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 text-sm font-bold hover:brightness-110 active:shadow-[inset_0_-1px_0_0_var(--color-wood-900),inset_0_1px_0_0_#c8a060] disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]'
const btnGhost =
  'px-4 py-1.5 rounded-lg border-2 border-wood-600 bg-parchment-250 text-wood-900 text-sm font-bold hover:bg-parchment-400 transition-colors'
const inputClass =
  'w-full px-3 py-2 rounded-lg bg-parchment-50 border-2 border-wood-600 text-soil-800 text-sm placeholder:text-parchment-500 focus:outline-none focus:border-wood-900 transition-colors'

export function CreateAccountModal({ onSuccess, onCancel }: Props) {
  const dataProvider = useDataProvider()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setError(null)
    setLoading(true)
    try {
      await (dataProvider as any).register('users', {
        data: { email: email.trim(), password },
      })
      onSuccess()
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm bg-parchment-150 border-4 border-wood-700 rounded-2xl shadow-[inset_0_0_0_3px_var(--color-parchment-50)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 hover:brightness-110 transition-[filter]"
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
        <div className="px-5 pt-5 pb-3 border-b-4 border-wood-700 bg-parchment-250 pr-14">
          <h2 className="text-soil-800 font-bold text-base">Create Account</h2>
          <p className="text-xs text-wood-700 pt-0.5">
            Save your map and progress across sessions.
          </p>
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
              className={inputClass}
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
              className={inputClass}
              required
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t-4 border-wood-700 bg-parchment-250 -mx-5 -mb-5 px-5 py-4">
            <button type="button" onClick={onCancel} className={btnGhost}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email.trim() || !password || loading}
              className={btnPrimary}
            >
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
