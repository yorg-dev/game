import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'
import { createGame } from './game'
import { EventBus } from './EventBus'

interface Props {
  onSceneReady?: (scene: Phaser.Scene) => void
}

export function PhaserGame({ onSceneReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Keep a stable ref to the callback so the effect doesn't re-run on re-renders.
  const onSceneReadyRef = useRef(onSceneReady)
  onSceneReadyRef.current = onSceneReady

  useEffect(() => {
    if (!containerRef.current) return

    const game = createGame(containerRef.current)

    const handler = (scene: Phaser.Scene) => onSceneReadyRef.current?.(scene)
    const unsubscribe = EventBus.on('scene-ready', handler)

    return () => {
      unsubscribe()
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
