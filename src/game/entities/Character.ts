import Phaser from 'phaser'

export type Direction = 'down' | 'left' | 'right' | 'up'

export class Character extends Phaser.Physics.Arcade.Sprite {
  protected readonly speed: number = 80
  protected readonly textureKey: string

  // Idle frame index per direction.  Procedural sprites use a 4-row layout;
  // real-asset sprites can override this to point at their neutral frame.
  protected idleFrames: Record<Direction, number> = { down: 0, left: 3, right: 6, up: 9 }

  // When true, the sprite is mirrored horizontally instead of playing a
  // separate left-facing animation.  Use for single-direction asset sheets.
  protected flipXOnLeft: boolean = false

  facing: Direction = 'down'

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey, 0)
    this.textureKey = textureKey
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
  }

  move(dx: number, dy: number): void {
    this.setVelocity(dx * this.speed, dy * this.speed)
    this.facing = this.vecToDir(dx, dy)
    if (this.flipXOnLeft) this.setFlipX(this.facing === 'left')
    this.anims.play(`${this.textureKey}-walk-${this.facing}`, true)
  }

  stop(): this {
    this.setVelocity(0, 0)
    this.anims.stop()
    this.setFrame(this.idleFrames[this.facing])
    return this
  }

  private vecToDir(dx: number, dy: number): Direction {
    if (Math.abs(dy) >= Math.abs(dx)) return dy >= 0 ? 'down' : 'up'
    return dx > 0 ? 'right' : 'left'
  }
}
