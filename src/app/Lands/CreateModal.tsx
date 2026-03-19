import { useState } from 'react'
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
  onSubmit: (name: string, isPublic: boolean) => Promise<void>
  onCancel: () => void
}

export function CreateLandModal({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setLoading(true)
    try {
      await onSubmit(name.trim(), isPublic)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create land.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GameDialog open onOpenChange={(o) => !o && onCancel()}>
      <GameDialogContent className="max-w-sm">
        <GameDialogHeader className="pr-14">
          <GameDialogTitle>Create Land</GameDialogTitle>
          <GameDialogDescription>Add a new map to your world.</GameDialogDescription>
        </GameDialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
              Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Team"
              className={gameInput}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
              Visibility
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${
                  isPublic
                    ? 'border-wood-700 bg-wood-500 text-soil-800'
                    : 'border-wood-600 bg-parchment-250 text-wood-900 hover:border-wood-700 hover:bg-parchment-400'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M1 6h10M6 1c-1.5 2-1.5 8 0 10M6 1c1.5 2 1.5 8 0 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Public
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${
                  !isPublic
                    ? 'border-wood-700 bg-wood-500 text-soil-800'
                    : 'border-wood-600 bg-parchment-250 text-wood-900 hover:border-wood-700 hover:bg-parchment-400'
                }`}
              >
                <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="shrink-0">
                  <rect
                    x="1.5"
                    y="4.5"
                    width="7"
                    height="5.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3 4.5V3a2 2 0 114 0v1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
                Private
              </button>
            </div>
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
            <button type="submit" disabled={!name.trim() || loading} className={gameBtn}>
              {loading ? 'Creating…' : 'Create Land'}
            </button>
          </GameDialogFooter>
        </form>
      </GameDialogContent>
    </GameDialog>
  )
}
