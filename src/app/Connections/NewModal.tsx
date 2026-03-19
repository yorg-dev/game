import { useState } from 'react'
import { useGetList, useCreate } from 'ra-core'
import type { App } from '@/models/App'
import type { ApiConnection } from '@/models/Connection'
import type { Tool } from '@/models/Tool'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
  GameDialogFooter,
  gameBtn,
  gameBtnGhost,
  gameInput,
} from '@/components/ui/game-dialog'

const AI_PROVIDER_APPS: App[] = [
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    description: 'Use your own Anthropic API key for agent chat',
    category: 'ai',
    auth_type: 'api_key',
    required_credentials: [],
    color: '#D97706',
    is_available: true,
    connection_type: 'anthropic',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Use your own OpenAI API key for agent chat',
    category: 'ai',
    auth_type: 'api_key',
    required_credentials: [],
    color: '#10A37F',
    is_available: true,
    connection_type: 'openai',
  },
]

function isAiProvider(app: App | null): boolean {
  return app?.connection_type === 'anthropic' || app?.connection_type === 'openai'
}

interface Props {
  onSuccess: (appId: string, connection: ApiConnection, tool: Tool | null) => void
  onCancel: () => void
}

type Step = 'choose-app' | 'credentials' | 'webhook'

const CATEGORY_COLORS: Record<string, string> = {
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

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: 'choose-app', label: '1 · Choose app' },
  { key: 'credentials', label: '2 · Connect' },
  { key: 'webhook', label: '3 · Add webhook' },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AppGrid({
  apps,
  loading,
  selected,
  onSelect,
}: {
  apps: App[]
  loading: boolean
  selected: App | null
  onSelect: (a: App) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2 p-5 max-h-80 overflow-y-auto">
      {loading && <p className="col-span-3 text-center text-sm text-wood-700 py-6">Loading…</p>}
      {apps.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onSelect(a)}
          className={`flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors ${
            selected?.id === a.id
              ? 'border-wood-900 bg-parchment-400'
              : 'border-wood-600 bg-parchment-250 hover:border-wood-700 hover:bg-parchment-400'
          }`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border border-wood-600/50"
            style={{ background: a.color + '33', color: a.color }}
          >
            {a.name.charAt(0)}
          </div>
          <div className="w-full min-w-0">
            <p className="text-sm font-bold text-soil-800 truncate">{a.name}</p>
            <span
              className={`mt-1 inline-block text-[10px] px-1.5 py-0 rounded border font-bold ${CATEGORY_COLORS[a.category] ?? 'bg-parchment-400 text-soil-800 border-wood-600'}`}
            >
              {a.category}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function CredentialsForm({
  app,
  label,
  credentials,
  aiModel,
  saving,
  error,
  onLabelChange,
  onCredentialChange,
  onAiModelChange,
  onBack,
  onSubmit,
}: {
  app: App
  label: string
  credentials: Record<string, string>
  aiModel: string
  saving: boolean
  error: string | null
  onLabelChange: (v: string) => void
  onCredentialChange: (key: string, value: string) => void
  onAiModelChange: (v: string) => void
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <div className="flex items-center gap-3 mx-5 mt-4 p-3 rounded-xl bg-parchment-250 border-2 border-wood-600">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border border-wood-600/50"
          style={{ background: app.color + '33', color: app.color }}
        >
          {app.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-soil-800">{app.name}</p>
          <p className="text-xs text-wood-700">
            {app.auth_type} · {app.category}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
            Connection Label
          </label>
          <input
            autoFocus
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder={`e.g. ${app.name} – Main`}
            className={gameInput}
          />
        </div>

        {isAiProvider(app) ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-wood-700 uppercase tracking-widest">AI Provider</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-wood-700 font-mono font-bold">API Key</label>
              <input
                type="password"
                value={credentials['api_key'] ?? ''}
                onChange={(e) => onCredentialChange('api_key', e.target.value)}
                placeholder={`Enter your ${app.name} API key`}
                className={`${gameInput} font-mono`}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-wood-700 font-mono font-bold">
                Model <span className="text-wood-600 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => onAiModelChange(e.target.value)}
                placeholder={
                  app.connection_type === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001'
                }
                className={`${gameInput} font-mono`}
              />
            </div>
            <p className="text-xs text-wood-600 italic">
              Your key is stored securely and never returned. Only one AI provider can be active at
              a time.
            </p>
          </div>
        ) : (
          (app.required_credentials ?? []).length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-wood-700 uppercase tracking-widest">
                Credentials
              </p>
              {(app.required_credentials ?? []).map((key) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs text-wood-700 font-mono font-bold">{key}</label>
                  <input
                    type={
                      key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')
                        ? 'password'
                        : 'text'
                    }
                    value={credentials[key] ?? ''}
                    onChange={(e) => onCredentialChange(key, e.target.value)}
                    placeholder={`Enter ${key}`}
                    className={`${gameInput} font-mono`}
                  />
                </div>
              ))}
            </div>
          )
        )}

        {error && (
          <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <GameDialogFooter>
        <button type="button" onClick={onBack} className={gameBtnGhost}>
          ‹ Back
        </button>
        <button
          type="submit"
          disabled={!label.trim() || saving}
          className="px-4 py-1.5 rounded-lg border-2 border-wood-700 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3),inset_0_-3px_0_0_rgba(0,0,0,0.3)] text-white text-sm font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]"
          style={{ background: app.color }}
        >
          {saving ? 'Connecting…' : `Connect ${app.name}`}
        </button>
      </GameDialogFooter>
    </form>
  )
}

function WebhookForm({
  app,
  webhookName,
  webhookUrl,
  saving,
  error,
  onNameChange,
  onUrlChange,
  onSkip,
  onSubmit,
}: {
  app: App
  webhookName: string
  webhookUrl: string
  saving: boolean
  error: string | null
  onNameChange: (v: string) => void
  onUrlChange: (v: string) => void
  onSkip: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
          <span className="text-emerald-700 text-xs font-bold">✓ Connected to {app.name}</span>
        </div>
        <p className="text-xs text-wood-700 leading-relaxed">
          Add a webhook URL so your agent can trigger it when you ask. You can skip this and add
          tools later.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 py-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
            Webhook Name
          </label>
          <input
            autoFocus
            value={webhookName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={`e.g. ${app.name} Notify`}
            className={gameInput}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-wood-700 uppercase tracking-widest">
            Webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/..."
            className={`${gameInput} font-mono`}
          />
        </div>

        {error && (
          <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <GameDialogFooter className="justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-wood-600 hover:text-wood-900 font-bold transition-colors"
        >
          Skip for now
        </button>
        <button type="submit" disabled={!webhookUrl.trim() || saving} className={gameBtn}>
          {saving ? 'Saving…' : 'Add Webhook'}
        </button>
      </GameDialogFooter>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function NewConnectionModal({ onSuccess, onCancel }: Props) {
  const [createConnection] = useCreate<ApiConnection>()
  const [createTool] = useCreate<Tool>()

  const { data: apps = [], isPending: appsLoading } = useGetList<App>('apps', {
    filter: { published: true },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  })

  const [step, setStep] = useState<Step>('choose-app')
  const [app, setApp] = useState<App | null>(null)
  const [label, setLabel] = useState('')
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [aiModel, setAiModel] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookName, setWebhookName] = useState('')
  const [createdConnection, setCreatedConnection] = useState<ApiConnection | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allApps = [...AI_PROVIDER_APPS, ...apps]

  function handleChooseApp(selected: App) {
    setApp(selected)
  }

  function handleNext() {
    if (!app) return
    setLabel(app.name)
    if (isAiProvider(app)) {
      setCredentials({ api_key: '' })
      setAiModel('')
    } else {
      setCredentials(Object.fromEntries((app.required_credentials ?? []).map((k) => [k, ''])))
    }
    setError(null)
    setStep('credentials')
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!app || !label.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const aiProvider = isAiProvider(app)
      const data: Record<string, unknown> = {
        name: label.trim(),
        connection_type: app.connection_type ?? 'webhook',
      }
      if (aiProvider) {
        data.credentials = credentials['api_key'] ?? ''
        data.options = aiModel.trim() ? { model: aiModel.trim() } : {}
      } else {
        data.options = credentials
      }
      const connection = await createConnection('connections', { data }, { returnPromise: true })
      setCreatedConnection((connection as ApiConnection) ?? null)
      if (aiProvider) {
        onSuccess(app.id, connection as ApiConnection, null)
      } else {
        setWebhookName(`${app.name} Webhook`)
        setStep('webhook')
      }
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
      const tool = await createTool(
        'tools',
        {
          data: {
            name: webhookName.trim() || `${app!.name} Webhook`,
            tool_type: 'webhook',
            options: { url: webhookUrl.trim() },
            active: true,
            connection_id: createdConnection.id,
          },
        },
        { returnPromise: true },
      )
      onSuccess(app!.id, createdConnection, (tool as Tool) ?? null)
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

  const currentStepIndex = STEP_LABELS.findIndex((s) => s.key === step)

  return (
    <GameDialog open onOpenChange={(o) => !o && onCancel()}>
      <GameDialogContent className="max-w-lg">
        <GameDialogHeader className="pr-10">
          <GameDialogTitle>New Connection</GameDialogTitle>
          <div className="flex items-center gap-2 pt-1 text-xs text-wood-700">
            {STEP_LABELS.map(({ key, label }, i) => (
              <span key={key} className="flex items-center gap-2">
                {i > 0 && <span>›</span>}
                <span
                  className={
                    step === key
                      ? 'font-bold text-soil-800'
                      : currentStepIndex > i
                        ? 'line-through opacity-40'
                        : 'opacity-50'
                  }
                >
                  {label}
                </span>
              </span>
            ))}
          </div>
        </GameDialogHeader>

        {/* Step 1 — App grid */}
        {step === 'choose-app' && (
          <>
            <AppGrid
              apps={allApps}
              loading={appsLoading}
              selected={app}
              onSelect={handleChooseApp}
            />
            <GameDialogFooter>
              <button onClick={onCancel} className={gameBtnGhost}>
                Cancel
              </button>
              <button disabled={!app} onClick={handleNext} className={gameBtn}>
                Next ›
              </button>
            </GameDialogFooter>
          </>
        )}

        {/* Step 2 — Credentials */}
        {step === 'credentials' && app && (
          <CredentialsForm
            app={app}
            label={label}
            credentials={credentials}
            aiModel={aiModel}
            saving={saving}
            error={error}
            onLabelChange={setLabel}
            onCredentialChange={(key, value) =>
              setCredentials((prev) => ({ ...prev, [key]: value }))
            }
            onAiModelChange={setAiModel}
            onBack={() => setStep('choose-app')}
            onSubmit={handleConnect}
          />
        )}

        {/* Step 3 — Webhook */}
        {step === 'webhook' && app && createdConnection && (
          <WebhookForm
            app={app}
            webhookName={webhookName}
            webhookUrl={webhookUrl}
            saving={saving}
            error={error}
            onNameChange={setWebhookName}
            onUrlChange={setWebhookUrl}
            onSkip={handleSkipWebhook}
            onSubmit={handleAddWebhook}
          />
        )}
      </GameDialogContent>
    </GameDialog>
  )
}
