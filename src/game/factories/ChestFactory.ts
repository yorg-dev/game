import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { DIALOGS } from '../dialog/dialogs'
import chestUrl from '../../assets/objects/chest.png'

// ---------------------------------------------------------------------------
// ChestFactory
//
// Owns all chest logic: asset loading, animation registration, spawning, and
// interaction. Exposes the static physics sprite for collider registration.
// ---------------------------------------------------------------------------

export class ChestFactory {
  private readonly scene: Phaser.Scene

  private _sprite: Phaser.Physics.Arcade.Sprite | null = null

  /** The static physics body — available after spawn(), used for colliders. */
  get sprite(): Phaser.Physics.Arcade.Sprite | null {
    return this._sprite
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Called from GameScene.preload().
  preload(): void {
    // Chest: 240×96 sheet, 48×48 frames, 5 cols × 2 rows
    this.scene.load.spritesheet('chest', chestUrl, { frameWidth: 48, frameHeight: 48 })
  }

  // Called from GameScene.create() — register animation before spawning.
  createAnimations(): void {
    this.scene.anims.create({
      key: 'chest-opening',
      frames: this.scene.anims.generateFrameNumbers('chest', { start: 0, end: 2 }),
      frameRate: 6,
      repeat: 0,
    })
  }

  // Reposition the chest when a land switch changes its map object position.
  moveTo(x: number, y: number): void {
    if (this._sprite) {
      this._sprite.setPosition(x, y)
      this._sprite.refreshBody()
    }
  }

  // Called from GameScene.create() after createAnimations().
  // onDialogOpen is called when the chest triggers a dialog so GameScene can
  // update its isDialogOpen guard flag.
  spawn(x: number, y: number, onDialogOpen: () => void): void {
    const sprite = this.scene.physics.add.staticSprite(x, y, 'chest', 0)
    sprite.setDepth(2)
    sprite.setInteractive({ useHandCursor: true })
    this._sprite = sprite

    this.scene.add
      .text(x, y + 28, 'Chest', {
        fontSize: '6px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(2)
      .setResolution(3)

    let isOpen = false

    sprite.on('pointerover', () => {
      if (!isOpen) sprite.setTint(0xddddff)
    })
    sprite.on('pointerout', () => {
      if (!isOpen) sprite.clearTint()
    })
    sprite.on('pointerup', () => {
      if (isOpen) return
      isOpen = true
      sprite.clearTint()
      sprite.play('chest-opening')
      const script = DIALOGS['chest']
      if (script) {
        onDialogOpen()
        EventBus.emit('dialog-start', { lines: script.lines })
      }
    })
  }
}
