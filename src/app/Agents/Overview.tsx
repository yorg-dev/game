import { useRecordContext } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import type { SelectedAgent } from './types'

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
        <span className="bg-[#c8b07a] border border-[#9a6b28] text-[#3d2010] text-xs font-bold px-2.5 py-1 rounded-md capitalize">
          {template.category}
        </span>
        <span className="bg-[#c8b07a] border border-[#9a6b28] text-[#3d2010] text-xs font-bold px-2.5 py-1 rounded-md">
          {template.name}
        </span>
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">Skills</p>
        <div className="flex flex-col gap-1.5">
          {template.skills.map((skill) => (
            <div
              key={skill.skillId}
              className="flex items-center gap-3 rounded-lg bg-[#dcc898] border-2 border-[#9a6b28] px-3 py-2"
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 border border-[#7a5230]/30"
                style={{ background: template.color + '55', color: '#3d2010' }}
              >
                {skill.order}
              </span>
              <span className="flex-1 text-sm text-[#3d2010] font-mono truncate">
                {skill.skillId}
              </span>
              {!skill.isRequired && (
                <span className="text-[10px] text-[#9a6b28] shrink-0 font-bold">optional</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Required Apps */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">
          Required Apps
        </p>
        <div className="flex flex-wrap gap-2">
          {template.requiredIntegrations.map((appId) => (
            <div
              key={appId}
              className="flex items-center gap-2 rounded-lg bg-[#dcc898] border-2 border-[#9a6b28] px-3 py-1.5"
            >
              <span className="w-2 h-2 rounded-full shrink-0 bg-[#9a6b28]" />
              <span className="text-sm font-bold text-[#3d2010]">{appId}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t-2 border-[#b8955a]">
        <button
          onClick={() => {
            EventBus.emit('select-agent', { id: agent.id })
            onClose()
          }}
          className="flex-1 px-3 py-1.5 rounded-lg text-sm font-bold text-[#3d2010] border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] hover:brightness-110 transition-[filter]"
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
