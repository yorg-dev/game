import { Character } from './Character'
import type Phaser from 'phaser'

/**
 * The human player character.  Always present, always WASD-controlled.
 * Agents are NPCs
 */
export class User extends Character {
  static readonly TEXTURE_KEY = 'char-user'

  // Idle frame = first frame of each directional row in the bunny sheet.
  protected idleFrames = { down: 0, up: 4, left: 8, right: 12 }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, User.TEXTURE_KEY)
    this.setDepth(5)    // render above NPC agents (depth 2)
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(10, 10)  // trim to visible bunny footprint
  }
}
