import { useRecordContext } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import type { SelectedAgent } from './types'
import { gameBtn } from '@/components/ui/game-dialog'

interface AgentOverviewProps {
  onClose: () => void
  onRemove: () => void
}

export function AgentOverview({ onClose, onRemove }: AgentOverviewProps) {
  const agent = useRecordContext<SelectedAgent>()
  if (!agent) return null

  const { template } = agent

  return (
    <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
      {/* Badges */}
      <div className="flex items-center gap-2">
        <span className="bg-parchment-400 border border-wood-600 text-soil-800 text-xs font-bold px-2.5 py-1 rounded-md capitalize">
          {template.category}
        </span>
        <span className="bg-parchment-400 border border-wood-600 text-soil-800 text-xs font-bold px-2.5 py-1 rounded-md">
          {template.name}
        </span>
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-wood-700 uppercase tracking-widest">Skills</p>
        <div className="flex flex-col gap-1.5">
          {template.skills.map((skill) => (
            <div
              key={skill.skill_id}
              className="flex items-center gap-3 rounded-lg bg-parchment-250 border-2 border-wood-600 px-3 py-2"
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 border border-wood-700/30"
                style={{ background: template.color + '55', color: '#3d2010' }}
              >
                {skill.order}
              </span>
              <span className="flex-1 text-sm text-soil-800 font-mono truncate">
                {skill.skill_id}
              </span>
              {!skill.is_required && (
                <span className="text-[10px] text-wood-600 shrink-0 font-bold">optional</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Required Apps */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-wood-700 uppercase tracking-widest">
          Required Apps
        </p>
        <div className="flex flex-wrap gap-2">
          {template.required_integrations.map((appId) => (
            <div
              key={appId}
              className="flex items-center gap-2 rounded-lg bg-parchment-250 border-2 border-wood-600 px-3 py-1.5"
            >
              <span className="w-2 h-2 rounded-full shrink-0 bg-wood-600" />
              <span className="text-sm font-bold text-soil-800">{appId}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t-2 border-parchment-500">
        <button
          onClick={() => {
            EventBus.emit('select-agent', { id: agent.id })
            onClose()
          }}
          className={`flex-1 ${gameBtn}`}
        >
          Take Control
        </button>
        <button
          onClick={onRemove}
          className="flex-1 px-3 py-1.5 rounded-lg text-sm font-bold text-[#f5e8d5] border-2 border-[#7a2828] bg-[#b84040] shadow-[inset_0_2px_0_0_#d86868,inset_0_-3px_0_0_#5a1818] hover:brightness-110 transition-[filter]"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
