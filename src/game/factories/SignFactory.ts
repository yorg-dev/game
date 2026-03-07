import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import signUrl from '../../assets/objects/signs_sides.png'

// ---------------------------------------------------------------------------
// SignFactory
//
// Owns all bulletin-board sign logic: asset loading, spawning, interaction.
// Exposes the static physics sprite so GameScene can register colliders.
// ---------------------------------------------------------------------------

export class SignFactory {
  private readonly scene: Phaser.Scene

  private _sprite: Phaser.Physics.Arcade.Sprite | null = null

  /** The static physics body — available after spawn(), used for colliders. */
  get sprite(): Phaser.Physics.Arcade.Sprite | null { return this._sprite }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Called from GameScene.preload().
  preload(): void {
    this.scene.load.spritesheet('sign', signUrl, { frameWidth: 16, frameHeight: 16 })
  }

  // Reposition the sign when a land switch changes its map object position.
  moveTo(x: number, y: number): void {
    if (this._sprite) {
      this._sprite.setPosition(x, y)
      this._sprite.refreshBody()
    }
  }

  // Called from GameScene.create() — place the sign and wire up interaction.
  spawn(x: number, y: number): void {
    const sprite = this.scene.physics.add.staticSprite(x, y, 'sign', 11)
    sprite.setDepth(2)
    sprite.setScale(2)
    sprite.refreshBody()
    sprite.setInteractive({ useHandCursor: true })
    this._sprite = sprite

    const tooltip = this.scene.add.text(x, y - 22, 'Bulletin Board', {
      fontSize:        '6px',
      color:           '#ffffff',
      backgroundColor: '#00000088',
      padding:         { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setDepth(3).setResolution(3).setVisible(false)

    sprite.on('pointerover', () => { sprite.setTint(0xddddff); tooltip.setVisible(true) })
    sprite.on('pointerout',  () => { sprite.clearTint();       tooltip.setVisible(false) })
    sprite.on('pointerup',   () => {
      sprite.clearTint()
      tooltip.setVisible(false)
      EventBus.emit('sign-clicked', undefined)
    })
  }
}
