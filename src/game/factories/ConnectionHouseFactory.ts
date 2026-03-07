import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { getApp } from '@/mocks/apps'
import { getConnectionDialog } from '../dialog/dialogs'
import type { Connection } from '@/models/Connection'
import { getActiveLand } from '@/providers/activeLand'
import type { MultiplayerManager } from '../multiplayer/MultiplayerManager'

export interface PositionedConnection {
  connection: Connection
  x: number
  y: number
}
import type { MapDefinition } from '../maps/MapDefinition'
import smallHouseUrl    from '../../assets/objects/small_house.png'
import greyBrickUrl     from '../../assets/objects/grey_brick_houses.png'

// ---------------------------------------------------------------------------
// ConnectionHouseFactory
//
// Owns all connection-house logic: asset loading, spawning, drag-and-drop,
// button overlay, and door-proximity queries.
// Extracted from GameScene to keep that file focused on scene coordination.
// ---------------------------------------------------------------------------

interface HouseEntry {
  sprite:     Phaser.Physics.Arcade.Image
  label:      Phaser.GameObjects.Text
  connection: Connection
  halfH:      number   // half sprite height — used for door proximity offset
}

// small_house.png: 3 cols × 3 rows, 64×64 frames.
// Frame index assigned by AppCategory so each type gets a distinct house colour.
const CATEGORY_FRAME: Record<string, number> = {
  ecommerce:   0,  // green roof
  support:     1,  // yellow roof
  email:       2,  // pink/red roof
  finance:     3,  // blue roof
  crm:         4,  // purple roof
  social:      5,  // light pink roof
  prospecting: 6,  // yellow-green roof
  ai:          7,  // orange roof
  // frame 8 (grey) reserved as fallback
}

const HOUSE_HALF   = 32   // half of 64 px sprite
const OVERLAP_DIST = 52   // min px between house centres

export class ConnectionHouseFactory {
  private readonly scene:        Phaser.Scene
  private readonly onDialogOpen: () => void

  private mapDef!:               MapDefinition
  private _group!:               Phaser.Physics.Arcade.StaticGroup
  private houses:                HouseEntry[] = []
  private _isDragging            = false
  private buttonContainer:       Phaser.GameObjects.Container | null = null
  private _connectedAppIds:      Set<string> = new Set()
  private multiplayer:           MultiplayerManager | null = null

  get group():           Phaser.Physics.Arcade.StaticGroup { return this._group }
  get isDragging():      boolean                           { return this._isDragging }
  get connectedAppIds(): Set<string>                       { return this._connectedAppIds }

  constructor(scene: Phaser.Scene, onDialogOpen: () => void) {
    this.scene        = scene
    this.onDialogOpen = onDialogOpen
  }

  // Called from GameScene.preload().
  preload(): void {
    // Connection houses: 192×192 sheet, 64×64 frames, 3 cols × 3 rows (9 variants by app category)
    this.scene.load.spritesheet('small-house', smallHouseUrl, { frameWidth: 64, frameHeight: 64 })
    // Home house: 288×80 sheet, 96×80 frames, 3 cols × 1 row
    this.scene.load.spritesheet('grey-brick-house', greyBrickUrl, { frameWidth: 96, frameHeight: 80 })
  }

  // Provide the MultiplayerManager so drag-end can broadcast position changes.
  setMultiplayer(mp: MultiplayerManager): void {
    this.multiplayer = mp
  }

  // Called from GameScene.create() after mapDef is resolved.
  // Initialises the physics group, loads initial houses, and registers the
  // world-click dismiss handler.
  create(mapDef: MapDefinition, initialHouses: PositionedConnection[]): void {
    this.mapDef = mapDef
    this._group = this.scene.physics.add.staticGroup()
    this.loadInitialHouses(initialHouses)

    // Dismiss the button overlay when the player clicks empty world space.
    this.scene.input.on('pointerdown', (_p: Phaser.Input.Pointer, hits: Phaser.GameObjects.GameObject[]) => {
      if (hits.length === 0) this.dismissButtons()
    })
  }

  // Add one connection house at the given world position.
  // Idempotent — silently ignores duplicate connectionIds.
  add(connection: Connection, x: number, y: number): void {
    if (this.houses.some(h => h.connection.id === connection.id)) return
    this.spawnHouse(connection, x, y)
    if (connection.status === 'connected') this._connectedAppIds.add(connection.appId)
  }

  // Remove a single house by connection ID.
  remove(connectionId: string): void {
    const index = this.houses.findIndex(h => h.connection.id === connectionId)
    if (index === -1) return
    const [entry] = this.houses.splice(index, 1)
    this._group.remove(entry.sprite, true, true)
    entry.label.destroy()
    this._connectedAppIds.delete(entry.connection.appId)
  }

  // Move a single house to a new world position.
  moveTo(connectionId: string, x: number, y: number): void {
    const entry = this.houses.find(h => h.connection.id === connectionId)
    if (!entry) return
    entry.sprite.setPosition(x, y)
    entry.sprite.refreshBody()
    entry.label.setPosition(x, entry.sprite.y + entry.halfH + 4)
  }

  // Destroy all houses and re-create from the provided placements.
  reload(houses: PositionedConnection[]): void {
    for (const { sprite, label } of this.houses) {
      this._group.remove(sprite, true, true)
      label.destroy()
    }
    this.houses = []
    this._connectedAppIds.clear()
    this.loadInitialHouses(houses)
  }

  // Find the connection whose door is closest to (x, y) within radius.
  // Each house uses its own halfH as the door y-offset from sprite centre.
  findNearestDoor(x: number, y: number, radius: number): Connection | null {
    let nearest:     Connection | null = null
    let nearestDist  = radius

    for (const house of this.houses) {
      const dist = Phaser.Math.Distance.Between(x, y, house.sprite.x, house.sprite.y + house.halfH)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest     = house.connection
      }
    }

    return nearest
  }

  // Destroy the active button overlay, if any.
  dismissButtons(): void {
    this.buttonContainer?.destroy()
    this.buttonContainer = null
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private loadInitialHouses(houses: PositionedConnection[]): void {
    for (const { connection, x, y } of houses) {
      this.add(connection, x, y)
    }
  }

  private spawnHouse(connection: Connection, x: number, y: number): void {
    const app         = getApp(connection.appId)
    const displayName = app?.name ?? connection.appId

    const isHome = connection.id === 'home'
    const texture = isHome ? 'grey-brick-house' : 'small-house'
    const frame   = isHome ? 0 : (CATEGORY_FRAME[app?.category ?? ''] ?? 8)
    const halfH   = isHome ? 40 : HOUSE_HALF   // 80/2 vs 64/2

    const sprite = this._group.create(x, y, texture, frame) as Phaser.Physics.Arcade.Image
    sprite.setDepth(2)
    sprite.setInteractive({ useHandCursor: true })
    // Drag is OFF by default — only enabled via the Move button.

    const label = this.scene.add.text(x, y + halfH + 4, displayName, {
      fontSize:        '6px',
      color:           '#ffffff',
      backgroundColor: '#00000088',
      padding:         { x: 3, y: 1 },
    }).setResolution(3)
    label.setOrigin(0.5, 0).setDepth(2)

    this.houses.push({ sprite, label, connection, halfH })

    let originX     = x
    let originY     = y
    let justDropped = false   // suppresses the pointerup after a dragend

    // ── Drag handlers (only active while drag is enabled) ──────────────────

    sprite.on('dragstart', () => {
      this._isDragging = true
      sprite.setAlpha(0.75).setDepth(10)
      label.setDepth(10)
    })

    sprite.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const { cols, rows, tileSize } = this.mapDef
      const cx = Phaser.Math.Clamp(dragX, halfH, cols * tileSize - halfH)
      const cy = Phaser.Math.Clamp(dragY, halfH, rows * tileSize - halfH)
      sprite.setPosition(cx, cy)
      label.setPosition(cx, cy + halfH + 4)
    })

    sprite.on('dragend', () => {
      this._isDragging = false
      justDropped      = true
      sprite.setAlpha(1).setDepth(2)
      label.setDepth(2)

      // Disable drag again — requires another Move button press.
      this.scene.input.setDraggable(sprite, false)
      sprite.clearTint()

      const overlaps = this.houses.some(h => {
        if (h.sprite === sprite) return false
        return Phaser.Math.Distance.Between(sprite.x, sprite.y, h.sprite.x, h.sprite.y) < OVERLAP_DIST
      })

      if (overlaps) {
        sprite.setTint(0xff4444)
        this.scene.time.delayedCall(280, () => sprite.clearTint())
        this.scene.tweens.add({
          targets:  sprite,
          x: originX, y: originY,
          duration: 220,
          ease:     'Back.Out',
          onUpdate:   () => label.setPosition(sprite.x, sprite.y + halfH + 4),
          onComplete: () => {
            label.setPosition(originX, originY + halfH + 4)
            sprite.refreshBody()
          },
        })
      } else {
        originX = sprite.x
        originY = sprite.y
        sprite.refreshBody()
        this.multiplayer?.broadcastPlacementMoved(connection.id, sprite.x, sprite.y)
      }
    })

    // ── Click: show Info / Move / Talk buttons ─────────────────────────────

    sprite.on('pointerover', () => { if (!this._isDragging) sprite.setTint(0xddddff) })
    sprite.on('pointerout',  () => { if (!this._isDragging) sprite.clearTint() })

    sprite.on('pointerup', () => {
      if (justDropped) { justDropped = false; return }
      if (this._isDragging) return
      const { canInteract, canManage } = getActiveLand()
      if (!canInteract && !canManage) return
      sprite.clearTint()
      this.showButtons(sprite, connection, canInteract, canManage, () => {
        // Move callback: enable drag for this sprite only.
        this.scene.input.setDraggable(sprite, true)
        sprite.setTint(0xffffaa)  // yellow = "grab me"
      })
    })
  }

  private showButtons(
    sprite:       Phaser.GameObjects.Image,
    connection:   Connection,
    canInteract:  boolean,
    canManage:    boolean,
    onMove:       () => void,
  ): void {
    this.dismissButtons()

    const bx = sprite.x
    const by = sprite.y - 34

    const container = this.scene.add.container(bx, by)
    container.setDepth(30)

    // Layout: Info always at -24; Talk and Move shift left when some are absent.
    const buttons: Array<{ label: string; color: number; onClick: () => void }> = []

    buttons.push({
      label:   'Info',
      color:   0x2244aa,
      onClick: () => EventBus.emit('connection-clicked', { connectionId: connection.id, appId: connection.appId, connection }),
    })

    if (canInteract) {
      buttons.push({
        label:   'Talk',
        color:   0x885522,
        onClick: () => {
          const app    = getApp(connection.appId)
          const script = getConnectionDialog(connection.id, app?.name ?? connection.appId)
          this.onDialogOpen()
          EventBus.emit('dialog-start', { lines: script.lines })
        },
      })
    }

    if (canManage) {
      buttons.push({ label: 'Move', color: 0x226622, onClick: onMove })
    }

    const W      = 28
    const GAP    = 4
    const totalW = buttons.length * W + (buttons.length - 1) * GAP
    const startX = -(totalW / 2) + W / 2

    buttons.forEach((btn, i) => {
      const offsetX = startX + i * (W + GAP)
      const H2  = 13
      const bg  = this.scene.add.rectangle(offsetX, 0, W, H2, btn.color, 0.92)
      bg.setStrokeStyle(1, 0xffffff, 0.15)
      const txt = this.scene.add.text(offsetX, 0, btn.label, {
        fontSize: '6px',
        color:    '#ffffff',
      }).setOrigin(0.5).setResolution(3)

      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerover',  () => bg.setAlpha(1))
      bg.on('pointerout',   () => bg.setAlpha(0.92))
      bg.on('pointerdown',  () => {
        this.dismissButtons()
        btn.onClick()
      })

      container.add([bg, txt])
    })

    this.buttonContainer = container
  }
}
