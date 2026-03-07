import { useState } from 'react'
import { APPS } from '@/mocks/apps'
import type { App } from '@/models/App'

interface Props {
  onSubmit: (appId: string, label: string, credentials: Record<string, string>) => void
  onCancel: () => void
}

type Step = 'choose-app' | 'credentials'

const btnPrimary = 'px-4 py-1.5 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] text-sm font-bold hover:brightness-110 active:shadow-[inset_0_-1px_0_0_#5a3810,inset_0_1px_0_0_#c8a060] disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]'
const btnGhost   = 'px-4 py-1.5 rounded-lg border-2 border-[#9a6b28] bg-[#dcc898] text-[#5a3810] text-sm font-bold hover:bg-[#c8b07a] transition-colors'

export function NewConnectionModal({ onSubmit, onCancel }: Props) {
  const [step, setStep]               = useState<Step>('choose-app')
  const [app, setApp]                 = useState<App | null>(null)
  const [label, setLabel]             = useState('')
  const [credentials, setCredentials] = useState<Record<string, string>>({})

  function handleNext() {
    if (!app) return
    setLabel(app.name)
    setCredentials(Object.fromEntries(app.requiredCredentials.map(k => [k, ''])))
    setStep('credentials')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!app || !label.trim()) return
    onSubmit(app.id, label.trim(), credentials)
  }

  const categoryColors: Record<string, string> = {
    ecommerce:   'bg-green-700/20 text-green-800 border-green-700/40',
    finance:     'bg-blue-700/20 text-blue-900 border-blue-700/40',
    email:       'bg-red-700/20 text-red-900 border-red-700/40',
    crm:         'bg-cyan-700/20 text-cyan-900 border-cyan-700/40',
    support:     'bg-purple-700/20 text-purple-900 border-purple-700/40',
    social:      'bg-orange-700/20 text-orange-900 border-orange-700/40',
    ai:          'bg-emerald-700/20 text-emerald-900 border-emerald-700/40',
    prospecting: 'bg-indigo-700/20 text-indigo-900 border-indigo-700/40',
  }

  return (
    <div data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="relative w-full max-w-lg bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"/>
          </svg>
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b-4 border-[#7a5230] bg-[#dcc898]">
          <h2 className="text-[#3d2010] font-bold text-base pr-10">New Connection</h2>
          <div className="flex items-center gap-2 pt-1 text-xs text-[#7a5230]">
            <span className={step !== 'choose-app' ? 'line-through opacity-50' : 'font-bold'}>
              1 · Choose app
            </span>
            <span>›</span>
            <span className={step === 'credentials' ? 'font-bold' : 'opacity-50'}>
              2 · Connect
            </span>
          </div>
        </div>

        {/* Step 1 — App grid */}
        {step === 'choose-app' && (
          <>
            <div className="grid grid-cols-3 gap-2 p-5 max-h-80 overflow-y-auto">
              {APPS.filter(a => a.isAvailable).map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setApp(a)}
                  className={`flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors ${
                    app?.id === a.id
                      ? 'border-[#5a3810] bg-[#c8b07a]'
                      : 'border-[#9a6b28] bg-[#dcc898] hover:border-[#7a5230] hover:bg-[#c8b07a]'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border border-[#9a6b28]/50"
                    style={{ background: a.color + '33', color: a.color }}
                  >
                    {a.name.charAt(0)}
                  </div>
                  <div className="w-full min-w-0">
                    <p className="text-sm font-bold text-[#3d2010] truncate">{a.name}</p>
                    <span className={`mt-1 inline-block text-[10px] px-1.5 py-0 rounded border font-bold ${categoryColors[a.category] ?? 'bg-[#c8b07a] text-[#3d2010] border-[#9a6b28]'}`}>
                      {a.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t-4 border-[#7a5230] bg-[#dcc898]">
              <button onClick={onCancel} className={btnGhost}>Cancel</button>
              <button disabled={!app} onClick={handleNext} className={btnPrimary}>Next ›</button>
            </div>
          </>
        )}

        {/* Step 2 — Credentials */}
        {step === 'credentials' && app && (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Selected app summary */}
            <div className="flex items-center gap-3 mx-5 mt-4 p-3 rounded-xl bg-[#dcc898] border-2 border-[#9a6b28]">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border border-[#9a6b28]/50"
                style={{ background: app.color + '33', color: app.color }}
              >
                {app.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#3d2010]">{app.name}</p>
                <p className="text-xs text-[#7a5230]">{app.authType} · {app.category}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 py-4">
              {/* Label */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">Connection Label</label>
                <input
                  autoFocus
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder={`e.g. ${app.name} – Main`}
                  className="w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810]"
                />
              </div>

              {/* Credential fields */}
              {app.requiredCredentials.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">Credentials</p>
                  {app.requiredCredentials.map(key => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#7a5230] font-mono font-bold">{key}</label>
                      <input
                        type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') ? 'password' : 'text'}
                        value={credentials[key] ?? ''}
                        onChange={e => setCredentials(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Enter ${key}`}
                        className="w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] font-mono focus:outline-none focus:border-[#5a3810]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t-4 border-[#7a5230] bg-[#dcc898]">
              <button type="button" onClick={() => setStep('choose-app')} className={btnGhost}>‹ Back</button>
              <button
                type="submit"
                disabled={!label.trim()}
                className="px-4 py-1.5 rounded-lg border-2 border-[#7a5230] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3),inset_0_-3px_0_0_rgba(0,0,0,0.3)] text-white text-sm font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]"
                style={{ background: app.color }}
              >
                Connect {app.name}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
