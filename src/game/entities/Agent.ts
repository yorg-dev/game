import Phaser from 'phaser'
import { Character } from './Character'
import type { AgentTemplate, AgentSkill } from '@/models/AgentTemplate'
import type { AgentType } from './AgentType'
import type { Direction } from './Character'

let nextId = 0

// Sprites that use a real right-facing asset sheet — mirror for left movement.
const ASSET_SPRITE_TYPES = new Set<string>(['engineering', 'marketing'])

export class Agent extends Character {
  readonly id:        number
  readonly name:      string
  readonly agentType: AgentType
  readonly template:  AgentTemplate

  private alertIndicator: Phaser.GameObjects.Text | null = null
  private tooltip:        Phaser.GameObjects.Text | null = null

  // ── Wander AI ────────────────────────────────────────────────────────────
  private static readonly WANDER_SPEED  =  28   // px/s (much slower than the player)
  private static readonly WANDER_RADIUS = 180   // max pixels per destination pick
  private static readonly ARRIVE_DIST   =   8   // px to target = "arrived"
  private static readonly MOVE_TIMEOUT  = 6000  // ms before giving up on a stuck path

  private wanderState:     'off' | 'choosing' | 'moving' | 'pausing' = 'off'
  private wanderTarget:    Phaser.Math.Vector2 | null = null
  private wanderMoveTime:  number = 0
  private wanderPauseTimer: Phaser.Time.TimerEvent | null = null

  constructor(
    scene:    Phaser.Scene,
    x:        number,
    y:        number,
    template: AgentTemplate,
    name:     string = `Agent #${nextId}`,
  ) {
    super(scene, x, y, `char-${template.sprite}`)
    this.id        = nextId++
    this.name      = name
    this.agentType = template.sprite as AgentType
    this.template  = template

    if (ASSET_SPRITE_TYPES.has(template.sprite)) {
      this.flipXOnLeft = true
      this.idleFrames  = { down: 0, left: 0, right: 0, up: 0 }
    }

    this.setInteractive()

    this.tooltip = scene.add.text(0, 0, name, {
      fontSize:        '6px',
      color:           '#ffffff',
      backgroundColor: '#00000099',
      padding:         { x: 3, y: 1 },
    }).setResolution(3).setOrigin(0.5, 1).setDepth(20).setVisible(false)

    this.on('pointerover', () => this.tooltip?.setVisible(true))
    this.on('pointerout',  () => this.tooltip?.setVisible(false))
  }

  /**
   * Snap position and animation to a state received from another client.
   * Bypasses wander AI — only called on remote (non-owner) agents.
   */
  applyRemoteState(x: number, y: number, facing: Direction, moving: boolean): void {
    this.setPosition(x, y)
    this.refreshBody()
    this.facing = facing
    if (this.flipXOnLeft) this.setFlipX(facing === 'left')
    if (moving) {
      this.anims.play(`${this.textureKey}-walk-${facing}`, true)
    } else {
      this.anims.stop()
      this.setFrame(this.idleFrames[facing])
    }
  }

  /** Returns the workflow step for the given skill id, if this agent has it. */
  getSkill(skillId: string): AgentSkill | undefined {
    return this.template.skills.find(s => s.skillId === skillId)
  }

  // ── Wander public API ───────────────────────────────────────────────────

  /** Begin autonomous wandering.  No-op if already wandering. */
  startWander(): void {
    if (this.wanderState !== 'off') return
    this.wanderState = 'choosing'
  }

  /** Stop wandering and stand still. */
  stopWander(): void {
    this.wanderPauseTimer?.remove(false)
    this.wanderPauseTimer = null
    this.wanderTarget     = null
    this.wanderMoveTime   = 0
    this.wanderState      = 'off'
    this.stop()
  }

  // ── Wander internals ────────────────────────────────────────────────────

  private tickWander(delta: number): void {
    switch (this.wanderState) {
      case 'choosing':
        this.chooseWanderTarget()
        break
      case 'moving':
        this.wanderMoveTime += delta
        if (this.wanderMoveTime > Agent.MOVE_TIMEOUT) {
          // Stuck — give up and pick a fresh destination.
          this.stop()
          this.wanderState = 'choosing'
        } else {
          this.stepTowardWanderTarget()
        }
        break
      // 'pausing': the delayedCall handles the transition; nothing to do per-frame.
    }
  }

  private chooseWanderTarget(): void {
    const bounds  = this.scene.physics.world.bounds
    const padding = 40
    const angle   = Math.random() * Math.PI * 2
    const dist    = 60 + Math.random() * (Agent.WANDER_RADIUS - 60)
    const x = Phaser.Math.Clamp(this.x + Math.cos(angle) * dist, padding, bounds.width  - padding)
    const y = Phaser.Math.Clamp(this.y + Math.sin(angle) * dist, padding, bounds.height - padding)

    this.wanderTarget   = new Phaser.Math.Vector2(x, y)
    this.wanderMoveTime = 0
    this.wanderState    = 'moving'
  }

  private stepTowardWanderTarget(): void {
    if (!this.wanderTarget) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y)

    if (dist < Agent.ARRIVE_DIST) {
      // Arrived — pause for 2–5 s then pick a new destination.
      this.stop()
      this.wanderTarget  = null
      this.wanderState   = 'pausing'
      this.wanderPauseTimer = this.scene.time.delayedCall(
        2000 + Math.random() * 3000,
        () => { if (this.wanderState === 'pausing') this.wanderState = 'choosing' },
      )
    } else {
      const dx = (this.wanderTarget.x - this.x) / dist
      const dy = (this.wanderTarget.y - this.y) / dist
      this.move(dx, dy)                                                    // sets animation + facing
      this.setVelocity(dx * Agent.WANDER_SPEED, dy * Agent.WANDER_SPEED) // override to slow speed
    }
  }

  /**
   * Show or hide the "needs attention" exclamation badge above this agent.
   * Called by GameScene whenever the set of connected apps changes.
   */
  setNeedsAttention(needs: boolean): void {
    if (needs && !this.alertIndicator) {
      this.alertIndicator = this.scene.add.text(this.x, this.y - 22, '!', {
        fontSize:        '10px',
        fontStyle:       'bold',
        color:           '#fbbf24',
        stroke:          '#92400e',
        strokeThickness: 3,
        backgroundColor: '#7c2d1280',
        padding:         { x: 4, y: 1 },
      })
      this.alertIndicator.setOrigin(0.5, 1).setDepth(15)

      // Pulse alpha to draw the eye without blocking the sprite.
      this.scene.tweens.add({
        targets:  this.alertIndicator,
        alpha:    { from: 1, to: 0.25 },
        duration: 650,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      })
    } else if (!needs && this.alertIndicator) {
      this.alertIndicator.destroy()
      this.alertIndicator = null
    }
  }

  /** Keep the badge positioned above the sprite as it moves, and tick the wander AI. */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    if (this.alertIndicator) {
      this.alertIndicator.setPosition(this.x, this.y - 22)
    }
    if (this.tooltip?.visible) {
      this.tooltip.setPosition(this.x, this.y - 18)
    }
    if (this.wanderState !== 'off') {
      this.tickWander(delta)
    }
  }

  destroy(fromScene?: boolean): void {
    this.wanderPauseTimer?.remove(false)
    this.wanderPauseTimer = null
    this.alertIndicator?.destroy()
    this.alertIndicator = null
    this.tooltip?.destroy()
    this.tooltip = null
    super.destroy(fromScene)
  }
}
