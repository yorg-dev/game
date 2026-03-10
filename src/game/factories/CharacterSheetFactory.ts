import Phaser from 'phaser'
import { User } from '../entities/User'
import type { Direction } from '../entities/Character'

// ---------------------------------------------------------------------------
// CharacterSheetFactory
//
// Handles all spritesheet creation and animation registration for characters.
// Extracted from GameScene to keep that file focused on scene coordination.
// ---------------------------------------------------------------------------

export class CharacterSheetFactory {
  private readonly scene: Phaser.Scene
  private readonly tileSize: number

  constructor(scene: Phaser.Scene, tileSize: number) {
    this.scene = scene
    this.tileSize = tileSize
  }

  // Bunny (char-user): 192×192 sheet, 48×48 frames, 4 cols × 4 rows.
  //   Row 0 (frames  0- 3): walk down
  //   Row 1 (frames  4- 7): walk up
  //   Row 2 (frames  8-11): walk left
  //   Row 3 (frames 12-15): walk right
  createBunnyAnimations(): void {
    const key = User.TEXTURE_KEY
    const COLS = 4
    const rows: { dir: Direction; row: number }[] = [
      { dir: 'down', row: 0 },
      { dir: 'up', row: 1 },
      { dir: 'left', row: 2 },
      { dir: 'right', row: 3 },
    ]
    for (const { dir, row } of rows) {
      this.scene.anims.create({
        key: `${key}-walk-${dir}`,
        frames: this.scene.anims.generateFrameNumbers(key, {
          start: row * COLS,
          end: row * COLS + COLS - 1,
        }),
        frameRate: 8,
        repeat: -1,
      })
    }
  }

  createAssetSpriteAnimations(type: 'engineering' | 'marketing'): void {
    const texKey = `char-${type}`

    const { frameCount, frameRate } =
      type === 'engineering'
        ? { frameCount: 4, frameRate: 8 } // chicken: 4 walk frames
        : { frameCount: 3, frameRate: 6 } // cow:     3 walk frames

    const frames = this.scene.anims.generateFrameNumbers(texKey, { start: 0, end: frameCount - 1 })
    const dirs: Direction[] = ['down', 'left', 'right', 'up']

    dirs.forEach((dir) => {
      this.scene.anims.create({ key: `${texKey}-walk-${dir}`, frames, frameRate, repeat: -1 })
    })
  }

  // Layout: 3 frames wide × 4 direction rows tall.
  //   Row 0 (frames  0-2): facing down
  //   Row 1 (frames  3-5): facing left
  //   Row 2 (frames  6-8): facing right
  //   Row 3 (frames 9-11): facing up
  createCharacterSheet(texKey: string, shirtColor: string): void {
    const S = this.tileSize
    if (this.scene.textures.exists(texKey)) this.scene.textures.remove(texKey)
    const tex = this.scene.textures.createCanvas(texKey, S * 3, S * 4)!
    const ctx = tex.getContext()

    const dirs: Direction[] = ['down', 'left', 'right', 'up']
    dirs.forEach((dir, row) => {
      for (let phase = 0; phase < 3; phase++) {
        this.drawCharFrame(ctx, phase * S, row * S, dir, phase, shirtColor)
      }
    })

    // Register frame metadata so generateFrameNumbers() can slice the texture.
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        tex.add(row * 3 + col, 0, col * S, row * S, S, S)
      }
    }

    tex.refresh()
  }

  private drawCharFrame(
    ctx: CanvasRenderingContext2D,
    fx: number,
    fy: number,
    dir: Direction,
    phase: number,
    shirtColor: string,
  ): void {
    const p = (x: number, y: number, w: number, h: number, c: string): void => {
      ctx.fillStyle = c
      ctx.fillRect(fx + x, fy + y, w, h)
    }

    // Walk phases: alternate left/right leg vertical offsets for a step cycle.
    const ll = phase === 1 ? -1 : phase === 2 ? 1 : 0
    const rl = phase === 1 ? 1 : phase === 2 ? -1 : 0

    // Shadow at feet
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(fx + 8, fy + 15, 4, 1.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Right leg (drawn before body so left leg layers on top for depth)
    p(9, 10 + rl, 3, 4, '#1e2d3d')
    p(9, 14 + rl, 3, 1, '#111111')

    // Body / shirt
    p(3, 6, 10, 5, shirtColor)

    // Left leg
    p(4, 10 + ll, 3, 4, '#1e2d3d')
    p(4, 14 + ll, 3, 1, '#111111')

    // Head
    p(4, 1, 8, 5, '#e8b090')

    // Hair
    p(4, 1, 8, 2, '#3a2010')

    // Eyes — direction-specific
    if (dir === 'down') {
      p(5, 4, 2, 1, '#111111')
      p(9, 4, 2, 1, '#111111')
    } else if (dir === 'left') {
      p(4, 4, 2, 1, '#111111')
    } else if (dir === 'right') {
      p(10, 4, 2, 1, '#111111')
    }
    // 'up': back of head, no eyes
  }

  createAnimations(texKey: string): void {
    const dirs: Array<{ dir: Direction; start: number }> = [
      { dir: 'down', start: 0 },
      { dir: 'left', start: 3 },
      { dir: 'right', start: 6 },
      { dir: 'up', start: 9 },
    ]

    dirs.forEach(({ dir, start }) => {
      this.scene.anims.create({
        key: `${texKey}-walk-${dir}`,
        frames: this.scene.anims.generateFrameNumbers(texKey, { start, end: start + 2 }),
        frameRate: 8,
        repeat: -1,
      })
    })
  }
}
