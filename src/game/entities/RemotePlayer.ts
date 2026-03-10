import Phaser from 'phaser'
import type { Direction } from './Character'

// Bunny idle frame indices (same layout as User.ts)
const IDLE_FRAMES: Record<Direction, number> = { down: 0, up: 4, left: 8, right: 12 }

// Blue tint to visually distinguish remote players from the local player
const REMOTE_TINT = 0x88bbff

/**
 * Visual-only representation of another player in the world.
 * No physics — position is driven by WebSocket messages and lerped each frame.
 */
export class RemotePlayer {
  readonly sprite: Phaser.GameObjects.Sprite
  readonly label: Phaser.GameObjects.Text

  private targetX: number
  private targetY: number
  private _facing: Direction
  private _moving: boolean

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, facing: Direction) {
    this.targetX = x
    this.targetY = y
    this._facing = facing
    this._moving = false

    this.sprite = scene.add
      .sprite(x, y, 'char-user', IDLE_FRAMES[facing])
      .setDepth(4)
      .setTint(REMOTE_TINT)

    this.label = scene.add
      .text(x, y - 26, name, {
        fontSize: '5px',
        color: '#e0f0ff',
        stroke: '#000000',
        strokeThickness: 2,
        resolution: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(10)
  }

  /** Called when a player-moved message arrives. */
  moveTo(x: number, y: number, facing: Direction, moving: boolean): void {
    this.targetX = x
    this.targetY = y
    this._facing = facing
    this._moving = moving
    this.applyAnim()
  }

  /** Called every game frame to interpolate toward the target position. */
  tick(): void {
    const nx = Phaser.Math.Linear(this.sprite.x, this.targetX, 0.18)
    const ny = Phaser.Math.Linear(this.sprite.y, this.targetY, 0.18)
    this.sprite.setPosition(nx, ny)
    this.label.setPosition(nx, ny - 26)
  }

  destroy(): void {
    this.sprite.destroy()
    this.label.destroy()
  }

  private applyAnim(): void {
    if (this._moving) {
      this.sprite.anims.play(`char-user-walk-${this._facing}`, true)
    } else {
      this.sprite.anims.stop()
      this.sprite.setFrame(IDLE_FRAMES[this._facing])
    }
  }
}
