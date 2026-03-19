import { useState } from 'react'
import { useAuthProvider } from 'ra-core'
import httpProvider from '@/providers/httpProvider'
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
  landId: string
  landName: string
  onSignIn: () => void
  onCancel: () => void
}

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
    <GameDialog open onOpenChange={(o) => !o && onCancel()}>
      <GameDialogContent className="max-w-sm">
        <GameDialogHeader className="pr-14">
          <GameDialogTitle>Invite to Land</GameDialogTitle>
          <GameDialogDescription className="truncate">{landName}</GameDialogDescription>
        </GameDialogHeader>

        {isGuest ? (
          <div className="flex flex-col gap-4 px-5 py-5">
            <p className="text-sm text-wood-900">
              Create a free account to invite others to your land and save your progress.
            </p>
            <GameDialogFooter className="-mx-5 -mb-5">
              <button type="button" onClick={onCancel} className={gameBtnGhost}>
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  onSignIn()
                  onCancel()
                }}
                className={gameBtn}
              >
                Create account
              </button>
            </GameDialogFooter>
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
            <GameDialogFooter className="-mx-5 -mb-5">
              <button
                type="button"
                onClick={() => {
                  setEmail('')
                  setSent(false)
                }}
                className={gameBtnGhost}
              >
                Invite another
              </button>
              <button type="button" onClick={onCancel} className={gameBtn}>
                Done
              </button>
            </GameDialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
                Email address
              </label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
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
              <button type="submit" disabled={!email.trim() || loading} className={gameBtn}>
                {loading ? 'Sending…' : 'Send Invite'}
              </button>
            </GameDialogFooter>
          </form>
        )}
      </GameDialogContent>
    </GameDialog>
  )
}
