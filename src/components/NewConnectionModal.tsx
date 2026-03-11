import { useState } from 'react'
import { APPS } from '@/mocks/apps'
import type { App } from '@/models/App'
import { connectionsProvider } from '@/providers/connectionsProvider'
import type { ApiConnection } from '@/providers/connectionsProvider'
import { toolsProvider } from '@/providers/toolsProvider'
import type { Tool } from '@/models/Tool'

interface Props {
  onSuccess: (appId: string, connection: ApiConnection, tool: Tool | null) => void
  onCancel: () => void
}

type Step = 'choose-app' | 'credentials' | 'webhook'

const btnPrimary =
  'px-4 py-1.5 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] text-sm font-bold hover:brightness-110 active:shadow-[inset_0_-1px_0_0_#5a3810,inset_0_1px_0_0_#c8a060] disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]'
const btnGhost =
  'px-4 py-1.5 rounded-lg border-2 border-[#9a6b28] bg-[#dcc898] text-[#5a3810] text-sm font-bold hover:bg-[#c8b07a] transition-colors'

export function NewConnectionModal({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<Step>('choose-app')
  const [app, setApp] = useState<App | null>(null)
  const [label, setLabel] = useState('')
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookName, setWebhookName] = useState('')
  const [createdConnection, setCreatedConnection] = useState<ApiConnection | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryColors: Record<string, string> = {
    ecommerce: 'bg-green-700/20 text-green-800 border-green-700/40',
    finance: 'bg-blue-700/20 text-blue-900 border-blue-700/40',
    email: 'bg-red-700/20 text-red-900 border-red-700/40',
    crm: 'bg-cyan-700/20 text-cyan-900 border-cyan-700/40',
    support: 'bg-purple-700/20 text-purple-900 border-purple-700/40',
    social: 'bg-orange-700/20 text-orange-900 border-orange-700/40',
    ai: 'bg-emerald-700/20 text-emerald-900 border-emerald-700/40',
    prospecting: 'bg-indigo-700/20 text-indigo-900 border-indigo-700/40',
    automation: 'bg-pink-700/20 text-pink-900 border-pink-700/40',
  }

  function handleNext() {
    if (!app) return
    setLabel(app.name)
    setCredentials(Object.fromEntries(app.requiredCredentials.map((k) => [k, ''])))
    setError(null)
    setStep('credentials')
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!app || !label.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const connection = await connectionsProvider.create({
        name: label.trim(),
        connection_type: app.connectionType ?? 'webhook',
        options: credentials,
      })
      setCreatedConnection(connection)
      setWebhookName(`${app.name} Webhook`)
      setStep('webhook')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create connection')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddWebhook(e: React.FormEvent) {
    e.preventDefault()
    if (!createdConnection || !webhookUrl.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const tool = await toolsProvider.create(createdConnection.id, {
        name: webhookName.trim() || `${app!.name} Webhook`,
        tool_type: 'webhook',
        options: { url: webhookUrl.trim() },
        active: true,
      })
      onSuccess(app!.id, createdConnection, tool)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create webhook')
    } finally {
      setSaving(false)
    }
  }

  function handleSkipWebhook() {
    if (!createdConnection || !app) return
    onSuccess(app.id, createdConnection, null)
  }

  const stepLabels: { key: Step; label: string }[] = [
    { key: 'choose-app', label: '1 · Choose app' },
    { key: 'credentials', label: '2 · Connect' },
    { key: 'webhook', label: '3 · Add webhook' },
  ]

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-lg bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
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
        <div className="px-5 pt-5 pb-3 border-b-4 border-[#7a5230] bg-[#dcc898]">
          <h2 className="text-[#3d2010] font-bold text-base pr-10">New Connection</h2>
          <div className="flex items-center gap-2 pt-1 text-xs text-[#7a5230]">
            {stepLabels.map(({ key, label }, i) => (
              <span key={key} className="flex items-center gap-2">
                {i > 0 && <span>›</span>}
                <span
                  className={
                    step === key
                      ? 'font-bold text-[#3d2010]'
                      : stepLabels.findIndex((s) => s.key === step) > i
                        ? 'line-through opacity-40'
                        : 'opacity-50'
                  }
                >
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Step 1 — App grid */}
        {step === 'choose-app' && (
          <>
            <div className="grid grid-cols-3 gap-2 p-5 max-h-80 overflow-y-auto">
              {APPS.filter((a) => a.isAvailable).map((a) => (
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
                    <span
                      className={`mt-1 inline-block text-[10px] px-1.5 py-0 rounded border font-bold ${categoryColors[a.category] ?? 'bg-[#c8b07a] text-[#3d2010] border-[#9a6b28]'}`}
                    >
                      {a.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t-4 border-[#7a5230] bg-[#dcc898]">
              <button onClick={onCancel} className={btnGhost}>
                Cancel
              </button>
              <button disabled={!app} onClick={handleNext} className={btnPrimary}>
                Next ›
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Credentials */}
        {step === 'credentials' && app && (
          <form onSubmit={handleConnect} className="flex flex-col">
            <div className="flex items-center gap-3 mx-5 mt-4 p-3 rounded-xl bg-[#dcc898] border-2 border-[#9a6b28]">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border border-[#9a6b28]/50"
                style={{ background: app.color + '33', color: app.color }}
              >
                {app.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#3d2010]">{app.name}</p>
                <p className="text-xs text-[#7a5230]">
                  {app.authType} · {app.category}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">
                  Connection Label
                </label>
                <input
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`e.g. ${app.name} – Main`}
                  className="w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810]"
                />
              </div>

              {app.requiredCredentials.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">
                    Credentials
                  </p>
                  {app.requiredCredentials.map((key) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#7a5230] font-mono font-bold">{key}</label>
                      <input
                        type={
                          key.toLowerCase().includes('secret') ||
                          key.toLowerCase().includes('token')
                            ? 'password'
                            : 'text'
                        }
                        value={credentials[key] ?? ''}
                        onChange={(e) =>
                          setCredentials((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={`Enter ${key}`}
                        className="w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] font-mono focus:outline-none focus:border-[#5a3810]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t-4 border-[#7a5230] bg-[#dcc898]">
              <button type="button" onClick={() => setStep('choose-app')} className={btnGhost}>
                ‹ Back
              </button>
              <button
                type="submit"
                disabled={!label.trim() || saving}
                className="px-4 py-1.5 rounded-lg border-2 border-[#7a5230] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3),inset_0_-3px_0_0_rgba(0,0,0,0.3)] text-white text-sm font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]"
                style={{ background: app.color }}
              >
                {saving ? 'Connecting…' : `Connect ${app.name}`}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — Webhook */}
        {step === 'webhook' && app && createdConnection && (
          <form onSubmit={handleAddWebhook} className="flex flex-col">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 text-xs font-bold">
                  ✓ Connected to {app.name}
                </span>
              </div>
              <p className="text-xs text-[#7a5230] leading-relaxed">
                Add a webhook URL so your agent can trigger it when you ask. You can skip this and
                add tools later.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-5 py-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">
                  Webhook Name
                </label>
                <input
                  autoFocus
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder={`e.g. ${app.name} Notify`}
                  className="w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] font-mono focus:outline-none focus:border-[#5a3810]"
                />
              </div>

              {error && (
                <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t-4 border-[#7a5230] bg-[#dcc898]">
              <button
                type="button"
                onClick={handleSkipWebhook}
                className="text-xs text-[#9a6b28] hover:text-[#5a3810] font-bold transition-colors"
              >
                Skip for now
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!webhookUrl.trim() || saving}
                  className={btnPrimary}
                >
                  {saving ? 'Saving…' : 'Add Webhook'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
