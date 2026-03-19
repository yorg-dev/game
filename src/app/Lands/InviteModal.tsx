import { useState } from 'react'
import { useAuthProvider } from 'ra-core'
import httpProvider from '@/providers/httpProvider'

interface Props {
  landId: string
  landName: string
  onSignIn: () => void
  onCancel: () => void
}

const btnPrimary =
  'px-4 py-1.5 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] text-sm font-bold hover:brightness-110 active:shadow-[inset_0_-1px_0_0_#5a3810,inset_0_1px_0_0_#c8a060] disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]'
const btnGhost =
  'px-4 py-1.5 rounded-lg border-2 border-[#9a6b28] bg-[#dcc898] text-[#5a3810] text-sm font-bold hover:bg-[#c8b07a] transition-colors'
const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810] transition-colors'

export function InviteLandModal({ landId, landName, onSignIn, onCancel }: Props) {
  const authProvider = useAuthProvider()
  const isGuest = (authProvider as any)?.isGuest?.() ?? false
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setLoading(true)
    try {
      const api = import.meta.env.VITE_API_URL as string
      await httpProvider(`${api}/lands/${landId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setSent(true)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send invite.')
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
        className="relative w-full max-w-sm bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close */}
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
          <h2 className="text-[#3d2010] font-bold text-base">Invite to Land</h2>
          <p className="text-xs text-[#7a5230] pt-0.5 truncate">{landName}</p>
        </div>

        {/* Body */}
        {isGuest ? (
          <div className="flex flex-col gap-4 px-5 py-5">
            <p className="text-sm text-[#5a3810]">
              Create a free account to invite others to your land and save your progress.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1 border-t-4 border-[#7a5230] bg-[#dcc898] -mx-5 -mb-5 px-5 py-4">
              <button type="button" onClick={onCancel} className={btnGhost}>
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  onSignIn()
                  onCancel()
                }}
                className={btnPrimary}
              >
                Create account
              </button>
            </div>
          </div>
        ) : sent ? (
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-emerald-50 border-2 border-emerald-300">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 text-emerald-700"
              >
                <path
                  d="M2 8l4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
              <p className="text-sm font-bold text-emerald-800">
                Invite sent to <span className="font-bold">{email}</span>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t-4 border-[#7a5230] bg-[#dcc898] -mx-5 -mb-5 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setEmail('')
                  setSent(false)
                }}
                className={btnGhost}
              >
                Invite another
              </button>
              <button type="button" onClick={onCancel} className={btnPrimary}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">
                Email address
              </label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
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
              <button type="submit" disabled={!email.trim() || loading} className={btnPrimary}>
                {loading ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
