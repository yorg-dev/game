import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { User } from '../entities/User'
import { APP_INTERIORS, DEFAULT_INTERIOR } from '../interiors/AppInterior'
import type { AppInterior, InteriorAction } from '../interiors/AppInterior'
import type { Connection } from '@/models/Connection'

// ---------------------------------------------------------------------------
// Room constants
// ---------------------------------------------------------------------------

const COLS       = 20
const ROWS       = 11
const TILE       = 16
const DOOR_START = 8    // inclusive — col index of left door edge
const DOOR_END   = 12   // exclusive — col index just past right door edge

/** World-space positions for up to 5 interactive terminals. */
const TERMINAL_POSITIONS = [
  { col: 3,  row: 3 },
  { col: 9,  row: 3 },
  { col: 15, row: 3 },
  { col: 5,  row: 7 },
  { col: 13, row: 7 },
]

const INTERACT_RADIUS = 34  // world px — how close the player needs to be

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export class IndoorScene extends Phaser.Scene {
  static readonly KEY = 'IndoorScene'

  private appId!:      string
  private connection!: Connection
  private interior!:   AppInterior

  private player!:     User
  private layer!:      Phaser.Tilemaps.TilemapLayer

  private eKey!:       Phaser.Input.Keyboard.Key

  private terminals:   Array<{ x: number; y: number; action: InteriorAction }> = []
  private promptText!: Phaser.GameObjects.Text
  private nearAction:  InteriorAction | null = null

  private unsubLeave?: () => void

  constructor() {
    super({ key: IndoorScene.KEY })
  }

  // Called by Phaser before create() — receives data passed via scene.launch()
  init(data: { appId: string; connection: Connection }): void {
    this.appId      = data.appId
    this.connection = data.connection
    this.interior   = APP_INTERIORS[this.appId] ?? DEFAULT_INTERIOR
    this.terminals  = []
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  create(): void {
    this.createIndoorTileset()
    this.layer = this.createRoom()
    this.spawnPlayer()
    this.createTerminals()
    this.createExitZone()
    this.setupCamera()
    this.setupInput()
    this.createPromptText()
    this.createRoomDecor()

    // React → Phaser: user clicked the Leave button in IndoorHUD
    this.unsubLeave = EventBus.on('leave-house', () => this.exitHouse())
    this.events.once('shutdown', () => this.unsubLeave?.())

    EventBus.emit('enter-house', {
      appId:      this.appId,
      connection: this.connection,
      interior:   this.interior,
    })
  }

  update(): void {
    this.updateNearTerminal()
    this.updatePrompt()

    // Keyboard movement
    const tag       = (document.activeElement?.tagName ?? '').toUpperCase()
    const isTyping  = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    const isModal   = !!document.querySelector('[role="dialog"]')
    if (isTyping || isModal) { this.player.stop(); return }

    const kbd  = this.input.keyboard!
    const left = kbd.addKey('A').isDown || kbd.addKey('LEFT').isDown
    const right= kbd.addKey('D').isDown || kbd.addKey('RIGHT').isDown
    const up   = kbd.addKey('W').isDown || kbd.addKey('UP').isDown
    const down = kbd.addKey('S').isDown || kbd.addKey('DOWN').isDown

    let dx = (right ? 1 : 0) - (left ? 1 : 0)
    let dy = (down  ? 1 : 0) - (up   ? 1 : 0)
    if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2 }

    if (dx !== 0 || dy !== 0) this.player.move(dx, dy)
    else                       this.player.stop()

    // E to interact with nearest terminal
    if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearAction) {
      EventBus.emit('terminal-interact', { appId: this.appId, action: this.nearAction })
    }
  }

  // ---------------------------------------------------------------------------
  // Tileset + room
  // ---------------------------------------------------------------------------

  private createIndoorTileset(): void {
    // 2-tile canvas: [floor | wall] each 16×16 px
    const key = `indoor-tiles-${this.appId}`
    if (this.textures.exists(key)) return  // already created (re-entry)

    const tex = this.textures.createCanvas(key, TILE * 2, TILE)!
    const ctx = tex.getContext()

    // Floor tile
    const fc = this.interior.floorColor
    ctx.fillStyle = fc
    ctx.fillRect(0, 0, TILE, TILE)
    // Subtle grid lines for wooden planks
    ctx.fillStyle = this.shadeHex(fc, -18)
    ctx.fillRect(0, TILE - 1, TILE, 1)
    ctx.fillRect(TILE - 1, 0, 1, TILE)
    ctx.fillStyle = this.shadeHex(fc, +18)
    ctx.fillRect(0, 0, TILE, 1)
    ctx.fillRect(0, 0, 1, TILE)

    // Wall tile
    const wc = this.interior.wallColor
    ctx.fillStyle = wc
    ctx.fillRect(TILE, 0, TILE, TILE)
    // Brick pattern — horizontal mortar lines
    ctx.fillStyle = this.shadeHex(wc, -20)
    ctx.fillRect(TILE, 4,  TILE, 1)
    ctx.fillRect(TILE, 9,  TILE, 1)
    ctx.fillRect(TILE, 14, TILE, 1)
    // Top highlight
    ctx.fillStyle = this.shadeHex(wc, +15)
    ctx.fillRect(TILE, 0, TILE, 1)

    // Register frame metadata
    tex.add(0, 0, 0,    0, TILE, TILE)  // floor
    tex.add(1, 0, TILE, 0, TILE, TILE)  // wall
    tex.refresh()
  }

  private buildRoomData(): number[][] {
    const data: number[][] = []
    for (let row = 0; row < ROWS; row++) {
      const rowData: number[] = []
      for (let col = 0; col < COLS; col++) {
        const isDoor = row === ROWS - 1 && col >= DOOR_START && col < DOOR_END
        const isWall = row === 0 || col === 0 || col === COLS - 1 || row === ROWS - 1
        // -1 = empty (no tile drawn), 0 = floor, 1 = wall
        rowData.push(isDoor ? -1 : isWall ? 1 : 0)
      }
      data.push(rowData)
    }
    return data
  }

  private createRoom(): Phaser.Tilemaps.TilemapLayer {
    const key  = `indoor-tiles-${this.appId}`
    const data = this.buildRoomData()

    const map   = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE })
    const tiles = map.addTilesetImage(key, key, TILE, TILE, 0, 0)!
    const layer = map.createLayer(0, tiles, 0, 0)!

    layer.setCollision(1)  // only wall tiles block movement
    this.physics.world.setBounds(0, 0, COLS * TILE, ROWS * TILE)
    return layer
  }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------

  private spawnPlayer(): void {
    // Spawn just inside the door (one tile above the door gap)
    const x = ((DOOR_START + DOOR_END) / 2) * TILE
    const y = (ROWS - 2) * TILE

    this.player = new User(this, x, y)
    this.player.facing = 'up'
    this.physics.add.collider(this.player, this.layer)
  }

  // ---------------------------------------------------------------------------
  // Terminals
  // ---------------------------------------------------------------------------

  private createTerminals(): void {
    const actions = this.interior.actions.slice(0, TERMINAL_POSITIONS.length)
    const accent  = this.interior.accentColor
    const dark    = this.shadeHex(accent, -40)
    const light   = this.shadeHex(accent, +30)

    actions.forEach((action, i) => {
      const { col, row } = TERMINAL_POSITIONS[i]
      const cx = col * TILE + TILE       // center x
      const cy = row * TILE + TILE / 2   // center y

      // Draw counter using Graphics
      const g = this.add.graphics()

      // Back face (dark)
      g.fillStyle(parseInt(dark.replace('#', ''), 16))
      g.fillRect(cx - 14, cy - 8, 28, 4)

      // Top surface (accent)
      g.fillStyle(parseInt(accent.replace('#', ''), 16))
      g.fillRect(cx - 14, cy - 12, 28, 8)

      // Highlight
      g.fillStyle(parseInt(light.replace('#', ''), 16))
      g.fillRect(cx - 14, cy - 12, 28, 1)

      // Screen / icon label
      const iconTxt = this.add.text(cx, cy - 8, action.icon, {
        fontSize:  '8px',
        color:     '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5).setDepth(3).setResolution(3)

      // Name label below counter
      this.add.text(cx, cy + 4, this.interior.terminalLabel, {
        fontSize:        '5px',
        color:           '#ffffff',
        backgroundColor: '#00000099',
        padding:         { x: 2, y: 1 },
      }).setOrigin(0.5, 0).setDepth(3).setResolution(3)

      // Store for proximity detection
      this.terminals.push({ x: cx, y: cy - 6, action })
      void iconTxt  // referenced to avoid lint warning
    })
  }

  // ---------------------------------------------------------------------------
  // Exit zone
  // ---------------------------------------------------------------------------

  private createExitZone(): void {
    const centerX = ((DOOR_START + DOOR_END) / 2) * TILE
    const centerY = ROWS * TILE   // just past the bottom wall

    const zone = this.add.zone(centerX, centerY, (DOOR_END - DOOR_START) * TILE, TILE * 2)
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY)
    this.physics.add.overlap(this.player, zone, () => this.exitHouse())
  }

  private exitHouse(): void {
    EventBus.emit('exit-house', undefined)
    this.scene.wake('GameScene')
    this.scene.stop()
  }

  // ---------------------------------------------------------------------------
  // Camera + input
  // ---------------------------------------------------------------------------

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE)
    this.cameras.main.setZoom(3)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setRoundPixels(true)
  }

  private setupInput(): void {
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E, false)
  }

  // ---------------------------------------------------------------------------
  // Interaction prompt
  // ---------------------------------------------------------------------------

  private createPromptText(): void {
    this.promptText = this.add.text(0, 0, '[E] Interact', {
      fontSize:        '6px',
      color:           '#ffffff',
      backgroundColor: '#000000cc',
      padding:         { x: 3, y: 2 },
    }).setOrigin(0.5, 1).setDepth(20).setResolution(3).setVisible(false)
  }

  private updateNearTerminal(): void {
    let closest: typeof this.terminals[0] | null = null
    let closestDist = INTERACT_RADIUS

    for (const t of this.terminals) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y)
      if (d < closestDist) { closestDist = d; closest = t }
    }

    this.nearAction = closest?.action ?? null
  }

  private updatePrompt(): void {
    if (this.nearAction) {
      this.promptText
        .setText(`[E] ${this.nearAction.label}`)
        .setPosition(this.player.x, this.player.y - 18)
        .setVisible(true)
    } else {
      this.promptText.setVisible(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Room decoration
  // ---------------------------------------------------------------------------

  private createRoomDecor(): void {
    const worldW = COLS * TILE
    const accent = this.interior.accentColor

    // App name banner along the top wall
    this.add.text(worldW / 2, TILE / 2, this.interior.displayName, {
      fontSize:  '7px',
      color:     accent,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(3).setResolution(3)

    // Door arch indicator at the bottom
    const doorCenterX = ((DOOR_START + DOOR_END) / 2) * TILE
    this.add.text(doorCenterX, (ROWS - 1) * TILE - 2, 'EXIT', {
      fontSize:  '5px',
      color:     '#aaaaaa',
    }).setOrigin(0.5, 1).setDepth(3).setResolution(3)
  }

  // ---------------------------------------------------------------------------
  // Colour utility
  // ---------------------------------------------------------------------------

  /**
   * Brighten (+) or darken (-) a hex colour by `amount` (0–255 per channel).
   * Returns a '#rrggbb' string.
   */
  private shadeHex(hex: string, amount: number): string {
    const n = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (n >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount))
    const b = Math.min(255, Math.max(0, (n & 0xff) + amount))
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
  }
}
