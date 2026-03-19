import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { getQuestsWithProgress } from '../quest/questStore'
import type { Quest } from '@/models/Quest'

// ---------------------------------------------------------------------------
// QuestFactory
//
// Manages the active quest list and fires tutorial dialogs on first launch.
// "First launch" is tracked via localStorage so the tutorial only plays once.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'yorg.tutorialSeen'

const TUTORIAL_DIALOG = [
  {
    speaker: 'Welcome',
    speakerColor: '#c8974c',
    text: 'Welcome! Use WASD to move around the world.',
  },
  {
    speaker: 'Welcome',
    speakerColor: '#c8974c',
    text: 'Open the menu to add Connections — each one becomes a house on your map that agents can work from.',
  },
  {
    speaker: 'Welcome',
    speakerColor: '#c8974c',
    text: "Spawn an Agent from the toolbar, then send it a command. Your agents handle the work so you don't have to.",
  },
]

export class QuestFactory {
  private readonly scene: Phaser.Scene

  private _quests = getQuestsWithProgress()

  get quests(): Quest[] {
    return this._quests
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Called from GameScene.create() after the scene is fully set up.
  // Loads quests and triggers the tutorial dialog on first visit.
  start(): void {
    this._quests = getQuestsWithProgress()

    if (this.isFirstVisit()) {
      // Small delay so the scene finishes rendering before the dialog box opens.
      this.scene.time.delayedCall(800, () => {
        EventBus.emit('dialog-start', { lines: TUTORIAL_DIALOG })
      })
      localStorage.setItem(STORAGE_KEY, '1')
    }
  }

  // Mark a quest step complete by quest id + step id.
  completeStep(questId: string, stepId: string): void {
    const quest = this._quests.find((q) => q.id === questId)
    if (!quest) return
    const step = quest.steps.find((s) => s.id === stepId)
    if (!step) return
    step.is_complete = true

    if (quest.steps.every((s) => s.is_complete)) {
      quest.status = 'completed'
    }
  }

  // Reset tutorial flag (useful for debug / testing).
  resetTutorial(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private isFirstVisit(): boolean {
    return !localStorage.getItem(STORAGE_KEY)
  }
}
